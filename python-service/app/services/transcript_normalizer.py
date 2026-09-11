import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..models.transcript import (
    NormalizedTranscriptModel,
    TranscriptSegmentModel,
    TranscriptWordModel
)

class PythonTranscriptNormalizer:
    @staticmethod
    def normalize(
        raw_segments: List[Dict[str, Any]],
        video_id: str = "unknown_video",
        video_duration: Optional[float] = None
    ) -> NormalizedTranscriptModel:
        if not raw_segments or not isinstance(raw_segments, list):
            return NormalizedTranscriptModel(
                video_id=video_id,
                duration=video_duration or 0.0,
                segments=[],
                total_words=0,
                version="1.0"
            )

        valid_segments: List[TranscriptSegmentModel] = []
        last_valid_end = 0.0

        for i, raw in enumerate(raw_segments):
            if not isinstance(raw, dict):
                continue

            text = str(raw.get("text") or raw.get("content") or raw.get("sentence") or "").strip()
            if not text:
                continue

            # Normalize smart quotes and whitespace
            text = text.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
            text = re.sub(r"\s+", " ", text).strip()
            if not text:
                continue

            # Start and end timestamps
            try:
                start = float(raw.get("start", raw.get("startTime", 0.0)))
            except (ValueError, TypeError):
                start = max(0.0, last_valid_end)

            try:
                end = float(raw.get("end", raw.get("endTime", 0.0)))
            except (ValueError, TypeError):
                word_count = len(text.split())
                end = start + max(1.0, word_count * 0.4)

            if start < 0 or start != start:
                start = max(0.0, last_valid_end)

            if end <= start or end != end:
                word_count = len(text.split())
                end = start + max(1.0, word_count * 0.4)

            # Micro-overlap correction
            if start < last_valid_end and last_valid_end > 0:
                if (last_valid_end - start) < 2.0:
                    start = last_valid_end
                    if end <= start:
                        end = start + 1.0

            # Video duration ceiling
            if video_duration and video_duration > 0:
                start = min(start, video_duration)
                end = min(end, video_duration)
                if start >= end:
                    continue

            # Word-level timing
            words_list = None
            raw_words = raw.get("words")
            if isinstance(raw_words, list) and len(raw_words) > 0:
                words_list = []
                for w in raw_words:
                    if not isinstance(w, dict):
                        continue
                    w_text = str(w.get("word") or w.get("text") or "").strip()
                    if not w_text:
                        continue
                    try:
                        w_start = float(w.get("start", start))
                        w_end = float(w.get("end", end))
                    except (ValueError, TypeError):
                        w_start, w_end = start, end

                    w_start = max(start, min(w_start, end))
                    w_end = max(w_start + 0.1, min(w_end, end))

                    words_list.append(TranscriptWordModel(
                        word=w_text,
                        start=round(w_start, 3),
                        end=round(w_end, 3),
                        confidence=float(w.get("confidence", 0.95)),
                        speaker=w.get("speaker") or raw.get("speaker")
                    ))

            seg = TranscriptSegmentModel(
                id=f"seg_{i + 1}",
                start=round(start, 3),
                end=round(end, 3),
                text=text,
                speaker=raw.get("speaker") or raw.get("speakerId") or "Speaker 1",
                words=words_list
            )
            valid_segments.append(seg)
            last_valid_end = seg.end

        valid_segments.sort(key=lambda s: s.start)
        for idx, s in enumerate(valid_segments):
            s.id = f"seg_{idx + 1}"

        calc_duration = valid_segments[-1].end if valid_segments else (video_duration or 0.0)
        total_words = sum(len(s.text.split()) for s in valid_segments)

        return NormalizedTranscriptModel(
            video_id=video_id,
            duration=round(video_duration or calc_duration, 3),
            segments=valid_segments,
            total_words=total_words,
            version="1.0",
            created_at=datetime.utcnow().isoformat()
        )
