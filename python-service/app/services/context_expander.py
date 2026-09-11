import re
from typing import List, Optional
from ..models.transcript import NormalizedTranscriptModel
from ..models.moment import RawCandidateModel

class PythonContextExpander:
    @staticmethod
    def expand(
        candidate: RawCandidateModel,
        transcript: NormalizedTranscriptModel,
        padding_before: float = 3.0,
        padding_after: float = 5.0,
        target_duration_profile: str = "medium",
        max_silence_gap: float = 3.5
    ) -> RawCandidateModel:
        segments = transcript.segments
        if not segments:
            return candidate

        min_duration = 15.0
        max_duration = 75.0
        if target_duration_profile == "short":
            min_duration, max_duration = 15.0, 35.0
        elif target_duration_profile == "medium":
            min_duration, max_duration = 30.0, 65.0
        elif target_duration_profile == "long":
            min_duration, max_duration = 45.0, 95.0

        orig_start = candidate.start_time
        orig_end = candidate.end_time

        # Find start segment
        start_idx = 0
        for i, s in enumerate(segments):
            if s.start <= orig_start <= s.end or s.start >= orig_start:
                start_idx = i
                break

        # Find end segment
        end_idx = len(segments) - 1
        for i in range(len(segments) - 1, -1, -1):
            if segments[i].start <= orig_end <= segments[i].end or segments[i].end <= orig_end:
                end_idx = i
                break

        if end_idx < start_idx:
            end_idx = start_idx

        # Expand backwards
        exp_start = segments[start_idx].start
        target_start_limit = max(0.0, orig_start - padding_before)

        for i in range(start_idx, -1, -1):
            seg = segments[i]
            if i > 0 and (segments[i].start - segments[i - 1].end) > max_silence_gap:
                exp_start = seg.start
                break
            if seg.start >= target_start_limit:
                exp_start = seg.start
                prev_seg = segments[i - 1] if i > 0 else None
                if not prev_seg or re.search(r'[.?!]["\']?$', prev_seg.text.strip()):
                    exp_start = seg.start
                    break
            else:
                break

        # Expand forwards
        exp_end = segments[end_idx].end
        target_end_limit = orig_end + padding_after

        for i in range(end_idx, len(segments)):
            seg = segments[i]
            if i > end_idx and (seg.start - segments[i - 1].end) > max_silence_gap:
                break
            if (seg.end - exp_start) > max_duration:
                break
            exp_end = seg.end
            if seg.end >= orig_end and re.search(r'[.?!]["\']?$', seg.text.strip()):
                exp_end = seg.end
                break
            if seg.end > target_end_limit:
                break

        final_start = max(0.0, round(exp_start, 1))
        final_end = round(exp_end, 1)
        final_dur = round(final_end - final_start, 1)

        return RawCandidateModel(
            id=candidate.id,
            start_time=final_start,
            end_time=final_end,
            title=candidate.title,
            hook=candidate.hook,
            reason=candidate.reason,
            category=candidate.category,
            score=candidate.score,
            suggested_duration_seconds=final_dur
        )
