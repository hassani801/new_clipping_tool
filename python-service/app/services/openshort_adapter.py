"""Subprocess adapter that drives the real OpenShorts engine.

OpenShorts exposes its clipping pipeline as a CLI
(``python main.py -i <video> -o <out_dir> --format vertical``), which its own
``app.py`` invokes per job. This adapter wraps the SAME CLI so the OpenShorts
project stays untouched and the integration stays reversible (Phase 17).

Responsibilities:
  1. translate our ``EngineInput`` into main.py CLI args + env overrides,
  2. run main.py in ``OPENSHORT_ROOT`` with ``OPENSHORT_PYTHON``,
  3. stream stdout and map real log markers onto our job stages (no fabricated
     progress),
  4. return the job output directory for the result parser.
"""
import os
import re
import sys
import time
import asyncio
import logging
from pathlib import Path
from typing import Awaitable, Callable, Dict, List, Optional

from ..config import settings
from ..models.engine import EngineInput
from ..models.job import JobStage
from ..rendering import OpenShortsReframer, OpenShortsCaptionRenderer, FFmpegEncoder

logger = logging.getLogger("openshort.adapter")

# progress callback: (stage: str, progress: int, message: str) -> None/awaitable
ProgressCallback = Callable[[str, int, str], Optional[Awaitable[None]]]


# --- settings translation ----------------------------------------------------

# Our aspectRatio -> OpenShorts --format.
_ASPECT_TO_FORMAT = {
    "9:16": "vertical",
    "1:1": "square",
    "16:9": "horizontal",
}


# targetDuration profile -> (CLIP_MIN_SECONDS, CLIP_MAX_SECONDS) band.
# These are honest TARGETS; OpenShorts clamps them to platform-sane limits and
# the model may return fewer clips when the material does not hold them.
_DURATION_BANDS = {
    "short": (15, 35),
    "medium": (30, 60),
    "long": (60, 90),
}


def map_format(aspect_ratio: Optional[str]) -> str:
    return _ASPECT_TO_FORMAT.get(aspect_ratio or "9:16", "vertical")


def duration_band(target_duration: Optional[str]):
    return _DURATION_BANDS.get(target_duration or "medium", _DURATION_BANDS["medium"])


def build_environment(input_data: EngineInput) -> Dict[str, str]:
    """Environment for the OpenShorts subprocess.

    The heavy OpenShorts dependencies stay in the interpreter named by
    ``OPENSHORT_PYTHON``; the env here only carries secrets and the job's
    per-run generation controls, exactly as OpenShorts' own ``/api/process``
    does.
    """
    env = os.environ.copy()

    # Secrets / encoding (main.py prints emojis; a cp1252 console dies on them).
    env["GEMINI_API_KEY"] = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
    env.setdefault("PYTHONIOENCODING", "utf-8")

    # Generation controls derived from our settings.
    st = input_data.settings
    clip_count = st.clipCount
    if isinstance(clip_count, int):
        env["CLIP_TARGET_MIN"] = env["CLIP_TARGET_MAX"] = str(clip_count)
    elif isinstance(clip_count, str) and clip_count.isdigit():
        env["CLIP_TARGET_MIN"] = env["CLIP_TARGET_MAX"] = clip_count

    lo, hi = duration_band(st.targetDuration)
    env["CLIP_MIN_SECONDS"] = str(lo)
    env["CLIP_MAX_SECONDS"] = str(hi)

    # Clip render concurrency (unified here: this is the single source of
    # truth; OpenShorts reads CLIP_WORKERS directly).
    env["CLIP_WORKERS"] = str(settings.CLIP_WORKERS)

    # Rendering stage: reframe / captions / encode are each behind a swappable
    # strategy that selects the OpenShorts engine's behavior via env overrides.
    reframer = OpenShortsReframer(aspect_ratio=st.aspectRatio)
    captioner = OpenShortsCaptionRenderer(caption_style=st.captionStyle)
    encoder = FFmpegEncoder()
    for strategy in (reframer, captioner, encoder):
        env.update(strategy.env_overrides())
        logger.info(f"[adapter] rendering: {strategy.describe()}")

    # Pass through optional engine tuning when our deployment sets it.
    for key in (
        "TRANSCRIBE_BACKEND",
        "TRANSCRIPT_PROVIDER",
        "DEEPGRAM_API_KEY",
        "WHISPER_MODEL", "WHISPER_DEVICE", "WHISPER_COMPUTE",
        "WHISPER_BEAM_SIZE", "WHISPER_CPU_THREADS", "WHISPER_NUM_WORKERS",
        "AUTO_HOOK", "AUTO_HOOK_STYLE", "GEMINI_MODEL",
    ):
        value = os.environ.get(key)
        if value:
            env[key] = value

    # Transcript provider: tier-selected before enqueue (services/tier_service)
    # and carried on EngineInput.transcript_provider. An explicit
    # TRANSCRIPT_PROVIDER in the service environment (pass-through above) wins
    # for testing/debugging; otherwise the tier decision applies.
    if not env.get("TRANSCRIPT_PROVIDER"):
        env["TRANSCRIPT_PROVIDER"] = (
            getattr(input_data, "transcript_provider", "") or "faster_whisper"
        )
    logger.info(f"[adapter] transcript_provider={env['TRANSCRIPT_PROVIDER']}")

    # Watermark: free-tier jobs only (tier decision made before enqueue — see
    # services/tier_service). The engine reads WATERMARK == "1" (main.py). Paid
    # output must stay clean, so 0 is explicit: it also beats any WATERMARK the
    # service process itself inherited, which env.copy() above would otherwise
    # leak into a paid job.
    env["WATERMARK"] = "1" if getattr(input_data, "watermark_enabled", False) else "0"
    logger.info(f"[adapter] watermark={'on' if env['WATERMARK'] == '1' else 'off'}")

    return env


def build_command(input_data: EngineInput) -> List[str]:
    """The exact argv OpenShorts' own app.py would build for this job."""
    fmt = map_format(input_data.settings.aspectRatio)
    # Always pass ABSOLUTE paths so the subprocess resolves them independently
    # of its cwd (OPENSHORT_ROOT). A relative "../storage/..." would resolve
    # against the OpenShorts checkout, not the service's storage root.
    input_abs = Path(input_data.input_path).resolve()
    output_abs = Path(input_data.output_directory).resolve()
    cmd = [
        settings.OPENSHORT_PYTHON, "-u", "main.py",
        "-i", str(input_abs),
        "-o", str(output_abs),
        "--format", fmt,
    ]
    return cmd


# --- real progress from subprocess logs -------------------------------------

# Ordered (regex, event). First match wins. Events:
#   ("stage", <JobStage value>)        -> fixed base progress
#   ("transcribe_pct", None)           -> progress derived from the NN% printed
#   ("clip_ready", None)               -> increment the finished-clip counter
#   ("message", <text>)                -> update the message only
_MARKERS: List[tuple] = [
    (re.compile(r"Transcribing…\s*(\d+)%"), "transcribe_pct"),
    (re.compile(r"Transcribing"), ("stage", "transcribing")),
    (re.compile(r"Analyzing with Gemini|Built \d+ scoring window|Shortlisted \d+ window"),
     ("stage", "finding_moments")),
    (re.compile(r"Detecting scenes|Scene engine|Scene Detection|Analyzing Scenes|Reframe engine"),
     ("stage", "reframing")),
    (re.compile(r"Processing video frames|Processing Clip \d+"),
     ("stage", "clipping")),
    (re.compile(r"Captions burned|Burning subtitles"),
     ("stage", "captions")),
    (re.compile(r"CLIP_READY\s+(\d+)"), "clip_ready"),
    (re.compile(r"Total execution time"), ("stage", "finalizing")),
]

_STAGE_BASE = {
    "transcribing": 40,
    "finding_moments": 58,
    "clipping": 68,
    "reframing": 76,
    "captions": 86,
    "finalizing": 97,
}


class StageTracker:
    """Turns OpenShorts' stdout lines into honest stage/progress updates.

    Also records wall-clock duration per stage (between consecutive distinct
    stage markers) so the pipeline can be benchmarked, not just progressed.
    """

    def __init__(self):
        self.clips_ready = 0
        self.current_stage: Optional[str] = None
        self._stage_start: Optional[float] = None
        self.timings: List[dict] = []

    def feed(self, line: str) -> Optional[dict]:
        """Returns a progress dict, or None if the line is not a marker."""
        for regex, event in _MARKERS:
            m = regex.search(line)
            if not m:
                continue

            if event == "transcribe_pct":
                pct = int(m.group(1))
                progress = min(55, 40 + int(pct * 0.15))
                return self._stage("transcribing", progress)

            if event == "clip_ready":
                self.clips_ready += 1
                progress = min(94, 88 + self.clips_ready * 2)
                return self._stage("clipping", progress)

            if isinstance(event, tuple):
                _, stage = event
                return self._stage(stage, _STAGE_BASE.get(stage, 60))

        return None

    def _stage(self, stage: str, progress: int) -> dict:
        now = time.monotonic()
        # Close out the previous stage's timing window when the stage changes.
        if self._stage_start is not None and self.current_stage and stage != self.current_stage:
            self.timings.append({
                "stage": self.current_stage,
                "durationMs": int((now - self._stage_start) * 1000),
            })
            self._stage_start = now
        elif self._stage_start is None:
            self._stage_start = now
        self.current_stage = stage
        return {"stage": stage, "progress": progress}

    def finalize(self) -> List[dict]:
        """Close the last open stage window and return the collected timings."""
        now = time.monotonic()
        if self._stage_start is not None and self.current_stage:
            self.timings.append({
                "stage": self.current_stage,
                "durationMs": int((now - self._stage_start) * 1000),
            })
            self._stage_start = None
        return self.timings


async def _report(callback: Optional[ProgressCallback], stage: str, progress: int, message: str):
    if not callback:
        return
    result = callback(stage, progress, message)
    if result is not None and hasattr(result, "__await__"):
        await result


async def run(input_data: EngineInput, on_progress: Optional[ProgressCallback] = None):
    """Run OpenShorts main.py to completion.

    Returns ``(output_dir, stage_timings, total_ms)`` on success; raises on
    failure. Progress is emitted through ``on_progress`` as real subprocess
    markers arrive, and stage wall-clock durations are captured for benchmark.
    """
    output_dir = Path(input_data.output_directory)
    output_dir.mkdir(parents=True, exist_ok=True)

    root = Path(settings.OPENSHORT_ROOT)
    main_py = root / "main.py"
    if not main_py.is_file():
        raise RuntimeError(
            f"OpenShorts engine not found at {main_py}. "
            f"Set OPENSHORT_ROOT to the engine/ folder (contains main.py)."
        )

    cmd = build_command(input_data)
    env = build_environment(input_data)
    logger.info(f"[adapter] exec: {' '.join(cmd)} (cwd={root})")

    started = time.monotonic()
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(root),
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
    except FileNotFoundError as e:
        raise RuntimeError(
            f"OpenShorts interpreter not found: {settings.OPENSHORT_PYTHON}. "
            f"Set OPENSHORT_PYTHON to a Python with engine/requirements.txt installed."
        ) from e

    tracker = StageTracker()
    assert proc.stdout is not None

    captured_lines: List[str] = []

    async def _read_stream():
        while True:
            raw = await proc.stdout.readline()
            if not raw:
                break
            line = raw.decode("utf-8", errors="replace").rstrip()
            if not line:
                continue
            captured_lines.append(line)
            logger.debug(f"[openshort] {line}")
            update = tracker.feed(line)
            if update:
                await _report(
                    on_progress,
                    update["stage"],
                    update["progress"],
                    line[:200],
                )

    reader_task = asyncio.create_task(_read_stream())

    try:
        returncode = await proc.wait()
    except asyncio.CancelledError:
        proc.kill()
        await proc.wait()
        raise
    finally:
        await reader_task

    total_ms = int((time.monotonic() - started) * 1000)
    stage_timings = tracker.finalize()

    if returncode != 0:
        full_output = "\n".join(captured_lines)
        tail_output = "\n".join(captured_lines[-50:]) or "(no output captured)"
        logger.error(
            f"[adapter] OpenShorts main.py exited with code {returncode}. "
            f"Full captured output:\n{full_output or '(no output captured)'}"
        )
        raise RuntimeError(
            f"OpenShorts processing failed with exit code {returncode}.\n"
            f"--- OpenShorts output (last 50 lines) ---\n{tail_output}"
        )

    return str(output_dir), stage_timings, total_ms


def probe_video(path) -> dict:
    """Best-effort probe of source width/height/duration via ffprobe.

    Used to attach input characteristics to job timing data so stage durations
    can later be correlated with source properties. Never raises.
    """
    import json
    import subprocess

    try:
        out = subprocess.check_output(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height",
             "-show_entries", "format=duration",
             "-of", "json", str(path)],
            timeout=60, stderr=subprocess.DEVNULL)
        data = json.loads(out)
        streams = data.get("streams") or [{}]
        duration = data.get("format", {}).get("duration")
        return {
            "width": streams[0].get("width"),
            "height": streams[0].get("height"),
            "durationSeconds": round(float(duration), 2) if duration else None,
        }
    except Exception:
        return {}
