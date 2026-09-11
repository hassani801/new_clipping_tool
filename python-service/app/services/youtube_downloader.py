"""Download a source video from a YouTube URL into a job's input directory.

Uses yt-dlp (the actively maintained fork of youtube-dl). This module ONLY
acquires the source file; once it is written into ``storage/jobs/{jobId}/input/``
the rest of the pipeline (transcription -> moment detection -> render) treats it
exactly like a directly uploaded file, with zero downstream changes.

Legal/platform note: downloading from YouTube may violate YouTube's Terms of
Service depending on use case (personal use vs. redistributing/monetizing
derived clips). That is a product/business decision, not something to silently
ignore -- consider adding a "you confirm you have rights to use this content"
checkbox before exposing this to real (especially multi-tenant / billing) users.
"""
import logging
import re
import time
from pathlib import Path
from typing import Callable, Optional

import yt_dlp

logger = logging.getLogger("openshort.youtube_downloader")


class SourceAcquisitionError(Exception):
    """Raised when the source video cannot be acquired from the URL.

    ``code`` is a stable, machine-readable error code surfaced to the frontend;
    ``message`` is a clean, user-facing message (raw yt-dlp details are logged
    internally, never shown to the end user).
    """

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


_YOUTUBE_URL_RE = re.compile(
    r"^https?://(www\.|m\.)?(youtube\.com/(watch\?v=|shorts/|live/|embed/)"
    r"|youtu\.be/)[A-Za-z0-9_-]{6,}",
    re.IGNORECASE,
)

_PROBE_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "skip_download": True,
    "noplaylist": True,
}


def _sanitize_filename(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", value or "").strip("._")
    return (cleaned or "youtube_video")[:80]


def _is_network_error(message: str) -> bool:
    lowered = (message or "").lower()
    markers = (
        "timed out",
        "connection",
        "network",
        "ssl",
        "getaddrinfo",
        "name or service not known",
        "errno",
        "reset by peer",
        "unreachable",
        "connect",
        "retry",
    )
    return any(m in lowered for m in markers)


def _probe(source_url: str) -> dict:
    """Fetch metadata only (no download), retrying once on network errors."""
    last_error: Optional[Exception] = None
    for attempt in range(2):
        try:
            with yt_dlp.YoutubeDL(_PROBE_OPTS) as ydl:
                return ydl.extract_info(source_url, download=False)
        except yt_dlp.utils.DownloadError as e:
            last_error = e
            logger.warning("[yt-dlp] probe attempt %d failed: %s", attempt + 1, e)
            if attempt == 0 and _is_network_error(str(e)):
                time.sleep(2.0)
                continue
            code = "DOWNLOAD_FAILED" if _is_network_error(str(e)) else "SOURCE_VIDEO_UNAVAILABLE"
            raise SourceAcquisitionError(
                code,
                "This video is unavailable (it may be private, deleted, "
                "region-locked, or age-restricted).",
            ) from e
        except Exception as e:
            last_error = e
            logger.warning("[yt-dlp] probe attempt %d failed: %s", attempt + 1, e)
            if attempt == 0:
                time.sleep(2.0)
                continue
            raise SourceAcquisitionError(
                "SOURCE_VIDEO_UNAVAILABLE",
                "Could not read the source video. Please check the link and try again.",
            ) from e

    raise SourceAcquisitionError(
        "SOURCE_VIDEO_UNAVAILABLE",
        "Could not read the source video. Please check the link and try again.",
    ) from last_error


def download_video(
    source_url: str,
    dest_dir: Path,
    max_height: int,
    max_duration_seconds: int,
    on_progress: Optional[Callable[[int], None]] = None,
) -> Path:
    """Download ``source_url`` into ``dest_dir`` and return the local file path.

    Raises :class:`SourceAcquisitionError` with a stable ``code`` on failure.
    ``on_progress`` (if given) is called with an integer percentage 0-100.
    """
    dest_dir = Path(dest_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)

    if not _YOUTUBE_URL_RE.match((source_url or "").strip()):
        raise SourceAcquisitionError(
            "INVALID_SOURCE_URL",
            "The provided link is not a supported YouTube URL.",
        )

    # 1. Probe metadata (no download) so over-limit videos are rejected early.
    info = _probe(source_url)

    duration = info.get("duration")
    if (
        duration is not None
        and max_duration_seconds > 0
        and float(duration) > max_duration_seconds
    ):
        raise SourceAcquisitionError(
            "SOURCE_VIDEO_TOO_LONG",
            f"This video is {int(float(duration))} seconds, exceeding the "
            f"{max_duration_seconds} second limit.",
        )

    title = _sanitize_filename(info.get("title") or "youtube_video")
    final_path = dest_dir / f"{int(time.time() * 1000)}_{title}.mp4"
    if final_path.exists():
        return final_path

    # 2. Download, reporting progress through the callback.
    download_stem = f"ytdlp_{int(time.time() * 1000)}"
    last_pct = {"value": -1}

    def hook(d):
        if not on_progress:
            return
        status = d.get("status")
        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            downloaded = d.get("downloaded_bytes") or 0
            if total:
                pct = min(99, int(downloaded * 100 / total))
                if pct != last_pct["value"]:
                    last_pct["value"] = pct
                    on_progress(pct)
        elif status == "finished":
            on_progress(100)

    opts = {
        "format": (
            f"bestvideo[height<={max_height}]+bestaudio/"
            f"best[height<={max_height}]/best"
        ),
        "merge_output_format": "mp4",
        "outtmpl": str(dest_dir / f"{download_stem}.%(ext)s"),
        "noplaylist": True,
        "progress_hooks": [hook],
        "noprogress": True,
        "quiet": True,
        "no_warnings": True,
    }

    last_error: Optional[Exception] = None
    for attempt in range(2):
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.extract_info(source_url, download=True)
            last_error = None
            break
        except yt_dlp.utils.DownloadError as e:
            last_error = e
            logger.warning("[yt-dlp] download attempt %d failed: %s", attempt + 1, e)
            if attempt == 0:
                time.sleep(2.0)
                continue
            code = "DOWNLOAD_FAILED" if _is_network_error(str(e)) else "SOURCE_VIDEO_UNAVAILABLE"
            raise SourceAcquisitionError(
                code,
                "The video could not be downloaded (it may be private, deleted, "
                "age-restricted, or a live stream).",
            ) from e
        except Exception as e:
            last_error = e
            logger.warning("[yt-dlp] download attempt %d failed: %s", attempt + 1, e)
            if attempt == 0:
                time.sleep(2.0)
                continue
            raise SourceAcquisitionError(
                "DOWNLOAD_FAILED",
                "Downloading the video failed. Please try again.",
            ) from e

    if last_error is not None:
        raise SourceAcquisitionError(
            "DOWNLOAD_FAILED",
            "Downloading the video failed after retries. Please try again.",
        ) from last_error

    # Locate the produced file and rename it to the final consistent name.
    produced: Optional[Path] = None
    for candidate in dest_dir.glob(f"{download_stem}.*"):
        produced = candidate
        break
    if produced is None:
        produced = max(
            (p for p in dest_dir.iterdir() if p.is_file() and p.name != final_path.name),
            key=lambda p: p.stat().st_mtime,
            default=None,
        )
    if produced is None:
        raise SourceAcquisitionError(
            "DOWNLOAD_FAILED",
            "Download finished but no output file was produced.",
        )

    if produced.resolve() != final_path.resolve():
        produced = produced.replace(final_path)

    logger.info("[yt-dlp] downloaded source to %s", final_path)
    return final_path
