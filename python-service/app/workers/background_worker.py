import time
import asyncio
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from ..models.job import (
    JobStatus,
    JobStage,
    JobStatusResponse,
    JobResultResponse,
    ClipResultModel,
    CreateJobRequest,
)
from ..models.engine import EngineInput, EngineOutput, EngineError
from ..engines.base_engine import BaseClipperEngine
from ..engines.openshort_engine import OpenShortClipperEngine
from ..engines.mock_engine import MockClipperEngine
from ..services.callback_service import CallbackService, default_callback_service
from ..services.youtube_downloader import SourceAcquisitionError, download_video
from ..services.media_info import probe_duration_seconds
from ..services.usage_service import default_usage_service
from ..storage import get_storage_backend
from ..storage.base import StorageBackend
from ..config import settings

logger = logging.getLogger("openshort.worker")

class JobExecutionState:
    def __init__(
        self,
        job_id: str,
        user_id: Optional[str] = None,
        tier: str = "free",
        provider: str = "faster_whisper",
        max_duration_seconds: Optional[int] = None,
    ):
        self.job_id = job_id
        # Stub user context (no auth yet — see services/tier_service.py).
        self.user_id = user_id or "anonymous"
        self.tier = tier
        self.provider = provider
        self.max_duration_seconds = max_duration_seconds
        self.source_duration_seconds: Optional[float] = None
        self.status = JobStatus.QUEUED
        self.stage = JobStage.QUEUED
        self.progress = 0
        self.message = "Job queued in processing buffer"
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.error: Optional[str] = None
        self.task: Optional[asyncio.Task] = None
        self.output: Optional[EngineOutput] = None

    @property
    def duration_seconds(self) -> float:
        if self.end_time:
            return round(self.end_time - self.start_time, 2)
        return round(time.time() - self.start_time, 2)

class BackgroundJobManager:
    def __init__(
        self,
        storage: Optional[StorageBackend] = None,
        callback: CallbackService = default_callback_service,
    ):
        self.storage = storage or get_storage_backend()
        self.callback = callback
        self.jobs: Dict[str, JobExecutionState] = {}
        self.default_engine: BaseClipperEngine = (
            OpenShortClipperEngine()
            if settings.ENGINE_TYPE == "openshort"
            else MockClipperEngine()
        )
        # Bound in-process concurrency so the GPU/CPU box isn't oversubscribed.
        self.semaphore = asyncio.Semaphore(max(1, settings.MAX_CONCURRENT_JOBS))

    def get_job_state(self, job_id: str) -> Optional[JobStatusResponse]:
        state = self.jobs.get(job_id)
        if not state:
            return None
        return JobStatusResponse(
            jobId=state.job_id,
            status=state.status,
            progress=state.progress,
            stage=state.stage,
            message=state.message,
            durationSeconds=state.duration_seconds,
            provider=state.provider,
        )

    def in_flight_count(self, user_id: str) -> int:
        """Queued/processing jobs for a user (counts toward the daily limit)."""
        return sum(
            1 for s in self.jobs.values()
            if s.user_id == user_id
            and s.status in (JobStatus.QUEUED, JobStatus.PROCESSING)
        )

    def get_job_result(self, job_id: str) -> Optional[JobResultResponse]:
        state = self.jobs.get(job_id)
        if not state:
            return None

        output = state.output
        if not output:
            error = None
            if state.error:
                error = {"code": "PROCESSING_ERROR", "message": state.error}
            return JobResultResponse(
                jobId=job_id,
                status=state.status,
                clips=[],
                error=error,
            )

        clips = []
        for c in output.clips:
            filename = Path(c.output_path).name if c.output_path else None
            clip_url = self.storage.clip_public_url(job_id, filename) if filename else None
            clips.append(ClipResultModel(
                id=c.id,
                title=c.title,
                startTime=c.start_time,
                endTime=c.end_time,
                duration=c.duration,
                score=c.score,
                hookSummary=c.hook_summary,
                captions=c.captions,
                clipUrl=clip_url,
                outputPath=c.output_path,
            ))

        error = None
        if output.error:
            error = {"code": output.error.code, "message": output.error.message, "details": output.error.details}

        return JobResultResponse(
            jobId=job_id,
            status=state.status,
            clips=clips,
            error=error,
            stageTimings=output.stage_timings,
            inputMeta=output.input_meta,
        )

    def enqueue_job(
        self,
        request: CreateJobRequest,
        engine: Optional[BaseClipperEngine] = None,
        user_id: Optional[str] = None,
        tier: str = "free",
        provider: str = "faster_whisper",
        max_duration_seconds: Optional[int] = None,
    ) -> JobStatusResponse:
        job_id = request.jobId

        state = JobExecutionState(
            job_id,
            user_id=user_id,
            tier=tier,
            provider=provider,
            max_duration_seconds=max_duration_seconds,
        )
        state.status = JobStatus.QUEUED
        state.stage = JobStage.QUEUED
        state.progress = 0
        state.message = "Job queued for video processing"
        self.jobs[job_id] = state

        logger.info(
            f"[JOB] {job_id} started (engine={engine.name if engine else self.default_engine.name}, "
            f"user={state.user_id}, tier={state.tier}, transcript_provider={state.provider})"
        )

        target_engine = engine or self.default_engine
        state.task = asyncio.create_task(
            self._execute_pipeline(state, request, target_engine)
        )

        return JobStatusResponse(
            jobId=job_id,
            status=state.status,
            progress=state.progress,
            stage=state.stage,
            message=state.message,
            durationSeconds=state.duration_seconds,
        )

    async def _execute_pipeline(
        self,
        state: JobExecutionState,
        request: CreateJobRequest,
        engine: BaseClipperEngine,
    ):
        # Gate on the concurrency semaphore; queued jobs wait here.
        await self.semaphore.acquire()
        try:
            await self._run_pipeline(state, request, engine)
        finally:
            self.semaphore.release()

    async def _run_pipeline(
        self,
        state: JobExecutionState,
        request: CreateJobRequest,
        engine: BaseClipperEngine,
    ):
        job_id = request.jobId
        state.status = JobStatus.PROCESSING
        state.stage = JobStage.INITIALIZING
        state.progress = 5
        state.message = "Preparing isolated workspace and input media..."

        try:
            # 1. Prepare directory structure: jobs/{jobId}/[input, working, outputs, metadata]
            job_dirs = self.storage.prepare_job_directory(job_id)

            async def progress_hook(stage_str: str, progress_val: int, msg: str):
                try:
                    state.stage = JobStage(stage_str)
                except ValueError:
                    state.stage = JobStage.PROCESSING if hasattr(JobStage, 'PROCESSING') else JobStage.FINDING_MOMENTS
                state.progress = progress_val
                state.message = msg
                logger.info(f"[JOB] {job_id} stage={stage_str} progress={progress_val}% ({msg})")

            # Resolve input: a YouTube sourceUrl the service downloads, a remote
            # inputUrl, or a shared-disk path / upload name. All three leave the
            # original source untouched and produce a local file for the engine.
            if getattr(request, "sourceUrl", None):
                # Tier-aware pre-download duration gate: yt-dlp probes metadata
                # (no download) and rejects over-limit videos immediately.
                input_resolved = await self._download_source(
                    request.sourceUrl,
                    job_dirs,
                    progress_hook,
                    state.max_duration_seconds or settings.MAX_SOURCE_VIDEO_DURATION_SECONDS,
                )
            elif getattr(request, "inputUrl", None):
                input_resolved = self.storage.stage_input_from_url(request.inputUrl, job_dirs)
            else:
                input_resolved = self.storage.resolve_input_path(request.inputPath, job_dirs)

            # Per-tier video-length gate, applied again on the resolved file so
            # inputUrl sources (whose length we couldn't probe up front) are
            # rejected BEFORE the engine starts any transcription/download work.
            state.source_duration_seconds = probe_duration_seconds(str(input_resolved))
            if (
                state.source_duration_seconds is not None
                and state.max_duration_seconds
                and state.source_duration_seconds > state.max_duration_seconds
            ):
                raise SourceAcquisitionError(
                    "VIDEO_TOO_LONG_FOR_TIER",
                    f"This video is {int(state.source_duration_seconds)} seconds; your "
                    f"{state.tier} tier allows up to {state.max_duration_seconds} "
                    "seconds.",
                )

            # 2. Invoke engine
            engine_input = EngineInput(
                job_id=job_id,
                input_path=str(input_resolved),
                output_directory=str(job_dirs["outputs"]),
                settings=request.settings,
                transcript_provider=state.provider,
            )

            output = await engine.process(engine_input, progress_callback=progress_hook)
            state.output = output
            state.end_time = time.time()

            # 3. Usage record (same in-memory lifetime as the job store — see
            #    services/usage_service.py). Recorded for any job that reached
            #    actual processing, completed or failed, so the free-tier daily
            #    limit and future Deepgram cost tracking see real consumption.
            default_usage_service.record(
                user_id=state.user_id,
                job_id=job_id,
                provider=state.provider,
                duration_seconds=state.source_duration_seconds,
            )
            logger.info(
                f"[USAGE] recorded user={state.user_id} job={job_id} "
                f"provider={state.provider} "
                f"duration={state.source_duration_seconds}s")

            if output.status == JobStatus.COMPLETED:
                # Publish outputs to object storage (no-op for the local backend).
                self.storage.publish_outputs(job_id)

                state.status = JobStatus.COMPLETED
                state.stage = JobStage.COMPLETED
                state.progress = 100
                state.message = f"Successfully generated {len(output.clips)} viral clips."
                logger.info(f"[JOB] {job_id} completed in {state.duration_seconds}s with {len(output.clips)} clips")
                if output.stage_timings:
                    summary = ", ".join(
                        f"{t['stage']}={t['durationMs'] / 1000:.1f}s"
                        for t in output.stage_timings
                    )
                    logger.info(f"[JOB] {job_id} stage timings: {summary}")
            else:
                state.status = JobStatus.FAILED
                state.stage = JobStage.FAILED
                state.error = output.error.message if output.error else "Unknown pipeline error"
                state.message = f"Engine failure: {state.error}"
                logger.error(f"[JOB] {job_id} failed: {state.error}")

            # 3. Clean up working scratch files
            self.storage.cleanup_working_files(job_id)

            # 4. Notify Next.js via internal callback
            await self.callback.notify_job_result(output)

        except asyncio.CancelledError:
            state.status = JobStatus.CANCELLED
            state.stage = JobStage.CANCELLED
            state.end_time = time.time()
            state.message = "Job was cancelled by client"
            logger.info(f"[JOB] {job_id} cancelled")

            cancelled_output = EngineOutput(
                job_id=job_id,
                status=JobStatus.CANCELLED,
                error=EngineError(code="JOB_CANCELLED", message="Processing was cancelled"),
            )
            await self.callback.notify_job_result(cancelled_output)

        except SourceAcquisitionError as e:
            state.status = JobStatus.FAILED
            state.stage = JobStage.FAILED
            state.end_time = time.time()
            state.error = e.message
            state.message = f"Source acquisition failed: {e.message}"
            logger.error(f"[JOB] {job_id} source acquisition failed ({e.code}): {e.message}")

            failed_output = EngineOutput(
                job_id=job_id,
                status=JobStatus.FAILED,
                error=EngineError(code=e.code, message=e.message),
            )
            state.output = failed_output
            await self.callback.notify_job_result(failed_output)

        except Exception as e:
            state.status = JobStatus.FAILED
            state.stage = JobStage.FAILED
            state.end_time = time.time()
            state.error = str(e)
            state.message = f"Unhandled worker exception: {e}"
            logger.exception(f"[JOB] {job_id} unhandled exception: {e}")

            failed_output = EngineOutput(
                job_id=job_id,
                status=JobStatus.FAILED,
                error=EngineError(code="WORKER_EXCEPTION", message=str(e)),
            )
            await self.callback.notify_job_result(failed_output)

    async def _download_source(
        self,
        source_url: str,
        job_dirs: Dict[str, Path],
        progress_hook,
        max_duration_seconds: int,
    ) -> Path:
        """Download a YouTube source into ``job_dirs['input']`` with progress.

        Runs the blocking yt-dlp call in a worker thread so the event loop stays
        responsive (health/status endpoints keep answering during the download).
        """
        loop = asyncio.get_running_loop()

        def on_progress(pct: int):
            # Map download 0-100% onto the job's 5-15% "downloading" band.
            overall = 5 + pct * 10 // 100
            asyncio.run_coroutine_threadsafe(
                progress_hook(
                    JobStage.DOWNLOADING.value,
                    overall,
                    f"Downloading video... {pct}%",
                ),
                loop,
            )

        await progress_hook(JobStage.DOWNLOADING.value, 5, "Downloading source video...")

        return await asyncio.to_thread(
            download_video,
            source_url,
            Path(job_dirs["input"]),
            settings.YTDLP_MAX_HEIGHT,
            max_duration_seconds,
            on_progress,
        )

    def cancel_job(self, job_id: str) -> bool:
        state = self.jobs.get(job_id)
        if not state:
            return False
        if state.task and not state.task.done():
            state.task.cancel()
            return True
        return False

default_job_manager = BackgroundJobManager()
