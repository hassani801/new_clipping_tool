"""Best-effort media probing helpers (ffprobe wrappers)."""
import json
import subprocess
from pathlib import Path
from typing import Optional


def probe_duration_seconds(path) -> Optional[float]:
    """Duration of the source in seconds, or None when it can't be probed.

    Never raises: callers treat an unprobeable source as "no duration known"
    (e.g. a path that doesn't exist yet) and let later stages surface the real
    error. Used for the per-tier video-length gate BEFORE any processing
    (download/transcription) starts.
    """
    try:
        out = subprocess.check_output(
            ["ffprobe", "-v", "error",
             "-show_entries", "format=duration",
             "-of", "json", str(path)],
            timeout=60, stderr=subprocess.DEVNULL)
        data = json.loads(out)
        duration = data.get("format", {}).get("duration")
        return round(float(duration), 2) if duration else None
    except Exception:
        return None
