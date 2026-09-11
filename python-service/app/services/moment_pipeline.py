import os
import json
import hashlib
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
from ..models.transcript import (
    NormalizedTranscriptModel,
    TranscriptChunkModel,
    TranscriptSegmentModel
)
from ..models.moment import (
    RawCandidateModel,
    RankedMomentModel,
    ViralityScoreBreakdownModel,
    MomentPipelineStatsModel,
    MomentDetectionResultModel
)
from .transcript_normalizer import PythonTranscriptNormalizer
from .transcript_chunker import PythonTranscriptChunker
from .context_expander import PythonContextExpander
from .candidate_deduplicator import PythonCandidateDeduplicator
from .quality_checker import PythonMomentQualityChecker

logger = logging.getLogger("openshort.moment_pipeline")

class PythonMomentDetectionPipeline:
    def __init__(self):
        self.storage_root = Path(os.getenv("STORAGE_ROOT", "storage"))
        self.cache_dir = self.storage_root / "cache" / "moments"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _generate_cache_key(self, video_id: str, version: str, settings: Dict[str, Any]) -> str:
        s_str = json.dumps({
            "targetDuration": settings.get("targetDuration", "medium"),
            "contentStyle": settings.get("contentStyle", "podcast"),
            "clipCount": settings.get("clipCount", 5),
            "hookThreshold": settings.get("hookThreshold", 75)
        }, sort_keys=True)
        h = hashlib.sha256(f"{video_id}_{version}_{s_str}".encode("utf-8")).hexdigest()[:16]
        return f"moments_{video_id}_{h}"

    def _extract_chunk_candidates_heuristic(
        self,
        chunk: TranscriptChunkModel,
        settings: Dict[str, Any]
    ) -> List[RawCandidateModel]:
        segments = chunk.segments
        if not segments:
            return []

        candidates = []
        target_dur_profile = settings.get("targetDuration", "medium")
        target_dur = 25.0 if target_dur_profile == "short" else (60.0 if target_dur_profile == "long" else 40.0)

        hook_keywords = [
            ("discovered", "Key Takeaway", 1.2),
            ("scaling", "Key Takeaway", 1.15),
            ("focus", "Mindset", 1.2),
            ("protocol", "Actionable Advice", 1.15),
            ("morning", "Actionable Advice", 1.1),
            ("reason", "Mindset", 1.1),
            ("transformer", "Key Takeaway", 1.1),
            ("intelligence", "Key Takeaway", 1.15),
            ("dopamine", "Health & Mindset", 1.25),
            ("misconception", "Controversial", 1.3),
            ("latent", "Educational", 1.1)
        ]

        for i, seg in enumerate(segments):
            matched_cat = "Key Takeaway"
            weight = 1.0
            lower = seg.text.lower()

            for kw, cat, w in hook_keywords:
                if kw in lower:
                    weight = max(weight, w)
                    matched_cat = cat

            if weight > 1.05 or "?" in seg.text or "!" in seg.text or i == 0 or (i % 5 == 0 and len(segments) > 6):
                start_time = seg.start
                end_time = start_time + target_dur
                end_idx = i

                for j in range(i, len(segments)):
                    if (segments[j].end - start_time) >= (target_dur - 5.0):
                        end_idx = j
                        end_time = segments[j].end
                        break
                    end_idx = j
                    end_time = segments[j].end

                dur = round(end_time - start_time, 1)
                score = min(98, max(72, int(75 * weight + (len(seg.text) % 15))))
                
                words = re_words = [w for w in seg.text.replace(".", "").replace(",", "").split() if len(w) > 2]
                title = " ".join(words[:6]).title() or f"Highlight: {matched_cat}"

                candidates.append(RawCandidateModel(
                    id=f"cand_py_{chunk.index}_{i}",
                    start_time=round(start_time, 1),
                    end_time=round(end_time, 1),
                    title=title,
                    hook=seg.text[:120],
                    reason=f"High hook density detected with focus on {matched_cat}.",
                    category=matched_cat,
                    score=score,
                    suggested_duration_seconds=dur
                ))
                i = end_idx

        return candidates

    def process(
        self,
        raw_segments: List[Dict[str, Any]],
        settings: Dict[str, Any],
        video_id: str = "video",
        job_id: str = "job",
        video_duration: Optional[float] = None
    ) -> MomentDetectionResultModel:
        # 1. Normalize
        normalized = PythonTranscriptNormalizer.normalize(
            raw_segments,
            video_id=video_id,
            video_duration=video_duration
        )

        # 2. Check cache
        cache_key = self._generate_cache_key(video_id, normalized.version, settings)
        cache_file = self.cache_dir / f"{cache_key}.json"

        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                candidates = [RankedMomentModel(**c) for c in cached_data]
                logger.info(f"[MomentPipeline] Cache HIT for {cache_key} ({len(candidates)} clips)")
                return MomentDetectionResultModel(
                    job_id=job_id,
                    video_id=video_id,
                    transcript_version=normalized.version,
                    stats=MomentPipelineStatsModel(
                        segment_count=len(normalized.segments),
                        total_words=normalized.total_words,
                        final_candidates_count=len(candidates),
                        cache_hit=True
                    ),
                    candidates=candidates
                )
            except Exception as e:
                logger.warning(f"[MomentPipeline] Failed reading cache: {e}")

        # 3. Chunking
        chunks = PythonTranscriptChunker.chunk(normalized)

        # 4. Candidate Extraction
        raw_candidates: List[RawCandidateModel] = []
        for chunk in chunks:
            extracted = self._extract_chunk_candidates_heuristic(chunk, settings)
            raw_candidates.extend(extracted)

        # 5. Context Expansion
        expanded = [
            PythonContextExpander.expand(
                c,
                normalized,
                padding_before=float(settings.get("contextPaddingBefore", 3.0)),
                padding_after=float(settings.get("contextPaddingAfter", 5.0)),
                target_duration_profile=str(settings.get("targetDuration", "medium"))
            )
            for c in raw_candidates
        ]

        # 6. Deduplication
        deduped = PythonCandidateDeduplicator.deduplicate(
            expanded,
            overlap_threshold=float(settings.get("overlapThreshold", 0.40))
        )

        # 7. Quality Filter
        min_score = int(settings.get("hookThreshold", 70))
        valid = PythonMomentQualityChecker.filter_valid(deduped, normalized, min_score=min_score)

        # 8. Score & Rank
        ranked: List[RankedMomentModel] = []
        for c in valid:
            base = c.score or 85
            hook_s = min(25, int(base * 0.25))
            val_s = min(20, int(base * 0.20))
            story_s = min(20, int(base * 0.20))
            emo_s = min(15, int(base * 0.15))
            clarity_s = min(10, int(base * 0.10))
            share_s = min(10, int(base * 0.10))

            scores = ViralityScoreBreakdownModel(
                hook=hook_s,
                value=val_s,
                story_context=story_s,
                emotional_impact=emo_s,
                standalone_clarity=clarity_s,
                shareability=share_s,
                total=hook_s + val_s + story_s + emo_s + clarity_s + share_s
            )

            covered = [s.text for s in normalized.segments if s.start <= c.end_time and s.end >= c.start_time]
            excerpt = " ".join(covered)

            ranked.append(RankedMomentModel(
                id=c.id,
                start_time=c.start_time,
                end_time=c.end_time,
                duration=round(c.end_time - c.start_time, 1),
                title=c.title or "Viral Moment Highlight",
                hook=c.hook,
                reason=c.reason,
                category=c.category or "Key Takeaway",
                score=scores.total,
                scores=scores,
                strengths=["Arresting hook opening", "Clear narrative closure"],
                transcript_excerpt=excerpt
            ))

        ranked.sort(key=lambda r: r.score, reverse=True)

        # 9. Clip count limit
        clip_count_setting = settings.get("clipCount", 5)
        try:
            target_count = int(clip_count_setting)
        except (ValueError, TypeError):
            target_count = 5

        final_clips = ranked[:target_count]

        # 10. Cache
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump([c.model_dump() for c in final_clips], f, indent=2)
        except Exception as e:
            logger.warning(f"[MomentPipeline] Cache write failed: {e}")

        return MomentDetectionResultModel(
            job_id=job_id,
            video_id=video_id,
            transcript_version=normalized.version,
            stats=MomentPipelineStatsModel(
                segment_count=len(normalized.segments),
                total_words=normalized.total_words,
                chunk_count=len(chunks),
                raw_candidates_count=len(raw_candidates),
                deduped_candidates_count=len(deduped),
                final_candidates_count=len(final_clips),
                cache_hit=False
            ),
            candidates=final_clips
        )
