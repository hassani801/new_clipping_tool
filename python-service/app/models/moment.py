from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ViralityScoreBreakdownModel(BaseModel):
    hook: int = Field(default=22, description="Hook strength (0-25)")
    value: int = Field(default=18, description="Insight and substance (0-20)")
    story_context: int = Field(default=18, description="Narrative completeness (0-20)")
    emotional_impact: int = Field(default=13, description="Emotional resonance (0-15)")
    standalone_clarity: int = Field(default=9, description="Self-contained clarity (0-10)")
    shareability: int = Field(default=8, description="Viral distribution potential (0-10)")
    total: int = Field(default=88, description="Overall viral potential (0-100)")

class RawCandidateModel(BaseModel):
    id: str
    start_time: float
    end_time: float
    title: Optional[str] = "Moment Highlight"
    hook: str
    reason: str
    category: Optional[str] = "Key Takeaway"
    score: int = 75
    suggested_duration_seconds: Optional[float] = None

class RankedMomentModel(BaseModel):
    id: str
    start_time: float
    end_time: float
    duration: float
    title: str
    hook: str
    reason: str
    category: str = "Key Takeaway"
    score: int = 85
    scores: ViralityScoreBreakdownModel = Field(default_factory=ViralityScoreBreakdownModel)
    strengths: List[str] = Field(default_factory=lambda: ["High retention opening", "Self-contained premise"])
    transcript_excerpt: Optional[str] = None
    output_path: Optional[str] = None
    thumbnail_path: Optional[str] = None

class MomentPipelineStatsModel(BaseModel):
    transcription_duration_ms: int = 0
    segment_count: int = 0
    total_words: int = 0
    chunk_count: int = 0
    raw_candidates_count: int = 0
    deduped_candidates_count: int = 0
    final_candidates_count: int = 0
    llm_provider: str = "gemini"
    llm_model: str = "gemini-3.7-flash"
    llm_request_count: int = 0
    llm_errors: List[str] = Field(default_factory=list)
    cache_hit: bool = False
    processing_time_ms: int = 0

class MomentDetectionResultModel(BaseModel):
    job_id: str
    video_id: str
    transcript_version: str = "1.0"
    stats: MomentPipelineStatsModel
    candidates: List[RankedMomentModel] = Field(default_factory=list)
