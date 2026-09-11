from typing import List, Tuple, TypeVar
from ..models.transcript import NormalizedTranscriptModel
from ..models.moment import RawCandidateModel

T = TypeVar("T", bound=RawCandidateModel)

class PythonMomentQualityChecker:
    @staticmethod
    def validate(
        candidate: RawCandidateModel,
        transcript: NormalizedTranscriptModel,
        min_score: int = 60,
        min_duration: float = 10.0,
        max_duration: float = 120.0
    ) -> Tuple[bool, List[str]]:
        errors: List[str] = []

        if candidate.start_time < 0 or candidate.start_time != candidate.start_time:
            errors.append(f"Invalid start_time: {candidate.start_time}")

        if candidate.end_time <= candidate.start_time or candidate.end_time != candidate.end_time:
            errors.append(f"Invalid end_time: {candidate.end_time} <= start_time: {candidate.start_time}")

        duration = candidate.end_time - candidate.start_time
        if duration < min_duration:
            errors.append(f"Duration {duration:.1f}s is below minimum {min_duration}s")
        if duration > max_duration:
            errors.append(f"Duration {duration:.1f}s exceeds maximum {max_duration}s")

        if transcript.duration > 0 and candidate.end_time > (transcript.duration + 2.0):
            errors.append(f"End time {candidate.end_time:.1f}s exceeds transcript duration {transcript.duration:.1f}s")

        covered = [
            s for s in transcript.segments
            if s.start <= candidate.end_time and s.end >= candidate.start_time
        ]
        if not covered:
            errors.append("No spoken transcript segments in interval")
        else:
            word_count = sum(len(s.text.split()) for s in covered)
            if word_count < 5:
                errors.append(f"Insufficient spoken words ({word_count}) in interval")

        if candidate.score < min_score:
            errors.append(f"Score {candidate.score} below threshold {min_score}")

        if not candidate.hook or len(candidate.hook.strip()) < 5:
            errors.append("Missing hook summary")

        return len(errors) == 0, errors

    @staticmethod
    def filter_valid(
        candidates: List[T],
        transcript: NormalizedTranscriptModel,
        min_score: int = 60
    ) -> List[T]:
        valid = []
        for c in candidates:
            is_valid, _ = PythonMomentQualityChecker.validate(c, transcript, min_score)
            if is_valid:
                valid.append(c)
        return valid
