import inspect
import logging
from pathlib import Path
from typing import Optional

from .base_engine import BaseClipperEngine, ProgressCallback
from ..models.engine import EngineInput, EngineOutput, EngineError
from ..models.job import JobStatus, JobStage
from ..services import openshort_adapter
from ..services import result_parser

logger = logging.getLogger("openshort.engine")


class OpenShortClipperEngine(BaseClipperEngine):
    """Drives the real OpenShorts engine (openshorts/main.py) as a subprocess.

    The adapter translates our EngineInput into OpenShorts' CLI/env contract and
    reports real progress parsed from the subprocess logs. No OpenShorts file is
    modified: this engine only wraps the existing CLI.
    """

    @property
    def name(self) -> str:
        return "OpenShortClipperEngine"

    @property
    def version(self) -> str:
        return "0.4.2-engine"

    async def _report(
        self,
        callback: Optional[ProgressCallback],
        stage: JobStage,
        progress: int,
        message: str,
    ):
        if not callback:
            return
        result = callback(stage.value, progress, message)
        if inspect.isawaitable(result):
            await result

    async def process(
        self,
        input_data: EngineInput,
        progress_callback: Optional[ProgressCallback] = None,
    ) -> EngineOutput:
        job_id = input_data.job_id
        input_path = Path(input_data.input_path)
        output_dir = Path(input_data.output_directory)

        try:
            # 1. INITIALIZING — verify the source before handing off.
            await self._report(
                progress_callback,
                JobStage.INITIALIZING,
                10,
                f"Validating input stream: {input_path.name or 'video_source'}",
            )
            if not input_path.is_file():
                raise RuntimeError(f"Input video not found: {input_path}")

            output_dir.mkdir(parents=True, exist_ok=True)

            # 2. ANALYZING — OpenShorts probes duration/layout before transcription.
            await self._report(
                progress_callback,
                JobStage.ANALYZING,
                20,
                "Handing off to the OpenShorts engine (probe + layout pick)...",
            )

            # 3-7. Run the real pipeline. Progress for transcribing /
            # finding_moments / reframing / clipping / captions / finalizing is
            # emitted by the adapter from the subprocess' own log markers, and
            # per-stage wall-clock timings are captured for benchmarking.
            _output_dir, stage_timings, total_ms = await openshort_adapter.run(
                input_data, on_progress=progress_callback)
            stage_timings.append({"stage": "total", "durationMs": total_ms})

            # 8. Parse the produced clips.
            clips = result_parser.parse_clips(output_dir, job_id)

            await self._report(
                progress_callback,
                JobStage.FINALIZING,
                99,
                f"Packaging {len(clips)} generated clip(s)...",
            )

            return EngineOutput(
                job_id=job_id,
                status=JobStatus.COMPLETED,
                clips=clips,
                stage_timings=stage_timings,
                input_meta={
                    "source": openshort_adapter.probe_video(input_path),
                    "clipCount": len(clips),
                    "aspectRatio": input_data.settings.aspectRatio,
                    "contentStyle": input_data.settings.contentStyle,
                },
            )

        except Exception as e:
            logger.exception(f"[engine] {job_id} failed")
            return EngineOutput(
                job_id=job_id,
                status=JobStatus.FAILED,
                error=EngineError(
                    code="OPENSHORT_PIPELINE_ERROR",
                    message=str(e),
                    details={"input_path": str(input_path)},
                ),
            )
