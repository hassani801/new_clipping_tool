import re
from typing import List
from ..models.transcript import (
    NormalizedTranscriptModel,
    TranscriptChunkModel,
    TranscriptSegmentModel
)

class PythonTranscriptChunker:
    @staticmethod
    def chunk(
        transcript: NormalizedTranscriptModel,
        target_chunk_duration: float = 240.0,
        min_chunk_duration: float = 180.0,
        max_chunk_duration: float = 480.0,
        overlap_duration: float = 35.0
    ) -> List[TranscriptChunkModel]:
        segments = transcript.segments
        if not segments:
            return []

        total_duration = transcript.duration or segments[-1].end

        if total_duration <= max_chunk_duration:
            return [
                TranscriptChunkModel(
                    index=0,
                    start_time=segments[0].start,
                    end_time=segments[-1].end,
                    duration=round(segments[-1].end - segments[0].start, 1),
                    segments=segments,
                    text=PythonTranscriptChunker.format_chunk_text(segments),
                    overlap_prev_seconds=0.0,
                    overlap_next_seconds=0.0
                )
            ]

        chunks: List[TranscriptChunkModel] = []
        current_start_idx = 0
        chunk_idx = 0

        while current_start_idx < len(segments):
            chunk_start_time = segments[current_start_idx].start
            ideal_end_time = chunk_start_time + target_chunk_duration
            hard_limit_end_time = chunk_start_time + max_chunk_duration

            best_end_idx = current_start_idx
            for i in range(current_start_idx, len(segments)):
                seg = segments[i]
                if seg.end <= hard_limit_end_time:
                    best_end_idx = i
                    if seg.end >= ideal_end_time:
                        if re.search(r'[.?!]["\']?$', seg.text.strip()) or seg.end >= (hard_limit_end_time - 10):
                            best_end_idx = i
                            break
                else:
                    break

            if best_end_idx == current_start_idx and current_start_idx < len(segments) - 1:
                best_end_idx = current_start_idx + 1

            chunk_segs = segments[current_start_idx:best_end_idx + 1]
            chunk_end_time = chunk_segs[-1].end

            overlap_prev = overlap_duration if chunk_idx > 0 else 0.0
            overlap_next = overlap_duration if best_end_idx < len(segments) - 1 else 0.0

            chunks.append(TranscriptChunkModel(
                index=chunk_idx,
                start_time=chunk_segs[0].start,
                end_time=chunk_end_time,
                duration=round(chunk_end_time - chunk_segs[0].start, 1),
                segments=chunk_segs,
                text=PythonTranscriptChunker.format_chunk_text(chunk_segs),
                overlap_prev_seconds=overlap_prev,
                overlap_next_seconds=overlap_next
            ))

            if best_end_idx >= len(segments) - 1:
                break

            next_target_start = max(chunk_start_time + min_chunk_duration, chunk_end_time - overlap_duration)
            next_start_idx = current_start_idx + 1

            for i in range(current_start_idx + 1, best_end_idx + 1):
                if segments[i].start >= next_target_start:
                    next_start_idx = i
                    break

            if next_start_idx <= current_start_idx:
                next_start_idx = current_start_idx + 1

            current_start_idx = next_start_idx
            chunk_idx += 1

        return chunks

    @staticmethod
    def format_chunk_text(segments: List[TranscriptSegmentModel]) -> str:
        lines = []
        for s in segments:
            spk = f"({s.speaker}) " if s.speaker else ""
            lines.append(f"[{s.start:.1f}s - {s.end:.1f}s] {spk}{s.text}")
        return "\n".join(lines)
