import asyncio
import inspect
from typing import Optional
from .base_engine import BaseClipperEngine, ProgressCallback
from ..models.engine import EngineInput, EngineOutput, EngineClipResult
from ..models.job import JobStatus, JobStage

class MockClipperEngine(BaseClipperEngine):
    @property
    def name(self) -> str:
        return "MockClipperEngine"

    @property
    def version(self) -> str:
        return "1.0.0"

    async def _report_progress(
        self,
        callback: Optional[ProgressCallback],
        stage: str,
        progress: int,
        message: str
    ):
        if not callback:
            return
        res = callback(stage, progress, message)
        if inspect.isawaitable(res):
            await res

    async def process(
        self,
        input_data: EngineInput,
        progress_callback: Optional[ProgressCallback] = None
    ) -> EngineOutput:
        job_id = input_data.job_id
        settings = input_data.settings

        # 1. Initializing
        await self._report_progress(
            progress_callback,
            JobStage.INITIALIZING.value,
            10,
            f"Initializing workspace for job {job_id}"
        )
        await asyncio.sleep(0.3)

        # 2. Analyzing video container
        await self._report_progress(
            progress_callback,
            JobStage.ANALYZING.value,
            25,
            f"Probing video streams at {input_data.input_path}"
        )
        await asyncio.sleep(0.4)

        # 3. Transcribing & Diarization
        await self._report_progress(
            progress_callback,
            JobStage.TRANSCRIBING.value,
            40,
            "Extracting audio channel and running speech-to-text diarization"
        )
        await asyncio.sleep(0.5)

        # 4. Finding Moments
        await self._report_progress(
            progress_callback,
            JobStage.FINDING_MOMENTS.value,
            60,
            f"Clustering {settings.contentStyle} semantic hooks and virality peaks"
        )
        await asyncio.sleep(0.5)

        # 5. Clipping & Reframing
        await self._report_progress(
            progress_callback,
            JobStage.CLIPPING.value,
            75,
            f"Applying {settings.aspectRatio} intelligent gaze crop bounding boxes"
        )
        await asyncio.sleep(0.4)

        # 6. Captions
        await self._report_progress(
            progress_callback,
            JobStage.CAPTIONS.value,
            88,
            f"Generating styled '{settings.captionStyle}' animated kinetic subtitle tracks"
        )
        await asyncio.sleep(0.3)

        # 7. Finalizing
        await self._report_progress(
            progress_callback,
            JobStage.FINALIZING.value,
            96,
            "Packaging candidate clips and encoding thumbnails"
        )
        await asyncio.sleep(0.3)

        # Build candidate clips
        clips = [
            EngineClipResult(
                id=f"clip_{job_id}_1",
                title="The Moment Scaling Laws Altered AI History",
                start_time=14.2,
                end_time=51.7,
                duration=37.5,
                score=97,
                output_path=f"{input_data.output_directory}/clip_1.mp4",
                thumbnail_path=f"{input_data.output_directory}/clip_1_thumb.jpg",
                hook_summary="High emotion declaration regarding unexpected intelligence emergence.",
                captions=[
                    {"word": "When", "start": 14.2, "end": 14.5},
                    {"word": "we", "start": 14.5, "end": 14.7},
                    {"word": "saw", "start": 14.7, "end": 15.0},
                    {"word": "the", "start": 15.0, "end": 15.2},
                    {"word": "loss", "start": 15.2, "end": 15.6},
                    {"word": "curve", "start": 15.6, "end": 16.0}
                ]
            ),
            EngineClipResult(
                id=f"clip_{job_id}_2",
                title="Why Compute Constraints Drive Breakthrough Architectures",
                start_time=118.0,
                end_time=162.4,
                duration=44.4,
                score=93,
                output_path=f"{input_data.output_directory}/clip_2.mp4",
                thumbnail_path=f"{input_data.output_directory}/clip_2_thumb.jpg",
                hook_summary="Strong punchline explaining algorithmic breakthroughs during hardware limits."
            ),
            EngineClipResult(
                id=f"clip_{job_id}_3",
                title="The 3 Questions Every Founder Must Answer",
                start_time=240.5,
                end_time=278.0,
                duration=37.5,
                score=89,
                output_path=f"{input_data.output_directory}/clip_3.mp4",
                thumbnail_path=f"{input_data.output_directory}/clip_3_thumb.jpg",
                hook_summary="Concise 3-step framework with rapid rhetorical cadence."
            )
        ]

        # Adjust count to requested clip_count if smaller
        selected_clips = clips[: max(1, min(settings.clipCount, len(clips)))]

        return EngineOutput(
            job_id=job_id,
            status=JobStatus.COMPLETED,
            clips=selected_clips
        )
