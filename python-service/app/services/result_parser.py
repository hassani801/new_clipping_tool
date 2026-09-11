"""Parse OpenShorts' ``{title}_metadata.json`` into our EngineClipResult list.

OpenShorts writes one metadata JSON per job containing the detected ``shorts``
(start/end/title/hook/score/copy) plus the full transcript and per-clip
``layout_ranges``. The served video for a clip may be a derived file
(``subtitled_<ts>_...`` / ``hooked_<ts>_...``), so we resolve the newest file
for each clip index — the same convention OpenShorts' own app.py uses.
"""
import glob
import json
import logging
from pathlib import Path
from typing import List, Optional

from ..models.engine import EngineClipResult

logger = logging.getLogger("openshort.result_parser")


def find_metadata_file(output_dir: str) -> Optional[Path]:
    files = sorted(glob.glob(str(Path(output_dir) / "*_metadata.json")))
    if not files:
        return None
    # Newest metadata wins (re-dump after hooks/captions).
    return Path(max(files, key=lambda p: Path(p).stat().st_mtime))


def _canonical_clip_file(output_dir: Path, stem: str, index: int) -> Optional[str]:
    """Resolve the file to serve for clip ``index`` (0-based), preferring a
    derived captioned/hooked version over the clean reframe."""
    clean = f"{stem}_clip_{index + 1}.mp4"
    derived = (
        glob.glob(str(output_dir / f"subtitled_*_{clean}"))
        + glob.glob(str(output_dir / f"hooked_*_{clean}"))
        + glob.glob(str(output_dir / f"hook_{clean}"))
    )
    if derived:
        newest = max(derived, key=lambda p: Path(p).stat().st_mtime)
        return Path(newest).name
    clean_path = output_dir / clean
    return clean if clean_path.is_file() else None


def _clip_relative_captions(transcript: dict, start: float, end: float) -> Optional[List[dict]]:
    """Word-level captions for the clip range, times relative to the clip start."""
    words = []
    for segment in (transcript or {}).get("segments", []):
        for w in segment.get("words", []):
            try:
                w_start = float(w.get("start", 0))
                w_end = float(w.get("end", 0))
            except (TypeError, ValueError):
                continue
            if w_end > start and w_start < end:
                words.append({
                    "word": (w.get("word") or "").strip(),
                    "start": round(max(0.0, w_start - start), 3),
                    "end": round(max(0.0, w_end - start), 3),
                })
    return words or None


def parse_clips(output_dir: str, job_id: str) -> List[EngineClipResult]:
    """Build EngineClipResult list from the OpenShorts metadata file."""
    metadata_path = find_metadata_file(output_dir)
    if not metadata_path:
        raise RuntimeError("OpenShorts finished but produced no metadata file.")

    try:
        with open(metadata_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        raise RuntimeError(f"Could not read OpenShorts metadata: {e}") from e

    shorts = data.get("shorts") or []
    if not shorts:
        raise RuntimeError("OpenShorts metadata contains no clips.")

    transcript = data.get("transcript") or {}
    stem = metadata_path.name.replace("_metadata.json", "")
    out_dir = Path(output_dir)

    clips: List[EngineClipResult] = []
    for i, short in enumerate(shorts):
        try:
            start = float(short.get("start", 0))
            end = float(short.get("end", 0))
        except (TypeError, ValueError):
            logger.warning(f"Clip {i} has invalid timestamps; skipping.")
            continue
        if end <= start:
            continue

        title = short.get("video_title_for_youtube_short") or f"Clip {i + 1}"
        score = int(short.get("predicted_score") or 0)
        output_name = _canonical_clip_file(out_dir, stem, i)
        output_path = str(out_dir / output_name) if output_name else None

        clips.append(EngineClipResult(
            id=f"clip_{job_id}_{i + 1}",
            title=str(title),
            start_time=round(start, 3),
            end_time=round(end, 3),
            duration=round(end - start, 3),
            score=score,
            output_path=output_path,
            thumbnail_path=None,  # OpenShorts main.py does not generate thumbnails
            hook_summary=str(short.get("viral_hook_text") or ""),
            captions=_clip_relative_captions(transcript, start, end),
        ))

    logger.info(f"[result] parsed {len(clips)} clip(s) from {metadata_path.name}")
    return clips
