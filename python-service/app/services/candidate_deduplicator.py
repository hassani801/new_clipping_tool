from typing import List, TypeVar
from ..models.moment import RawCandidateModel

T = TypeVar("T", bound=RawCandidateModel)

class PythonCandidateDeduplicator:
    @staticmethod
    def calculate_overlap_ratio(
        start1: float,
        end1: float,
        start2: float,
        end2: float
    ) -> float:
        overlap_start = max(start1, start2)
        overlap_end = min(end1, end2)
        overlap_duration = max(0.0, overlap_end - overlap_start)

        if overlap_duration <= 0:
            return 0.0

        dur1 = max(0.1, end1 - start1)
        dur2 = max(0.1, end2 - start2)

        return overlap_duration / min(dur1, dur2)

    @staticmethod
    def deduplicate(candidates: List[T], overlap_threshold: float = 0.40) -> List[T]:
        if not candidates or len(candidates) <= 1:
            return candidates

        sorted_cands = sorted(candidates, key=lambda c: (c.score or 0), reverse=True)
        retained: List[T] = []

        for cand in sorted_cands:
            is_dup = False
            for accepted in retained:
                overlap = PythonCandidateDeduplicator.calculate_overlap_ratio(
                    cand.start_time,
                    cand.end_time,
                    accepted.start_time,
                    accepted.end_time
                )
                if overlap >= overlap_threshold:
                    is_dup = True
                    break

            if not is_dup:
                retained.push(cand) if hasattr(retained, "push") else retained.append(cand)

        return retained
