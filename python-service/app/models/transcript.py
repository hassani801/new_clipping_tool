from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TranscriptWordModel(BaseModel):
    word: str
    start: float
    end: float
    confidence: Optional[float] = 0.95
    speaker: Optional[str] = None

class TranscriptSegmentModel(BaseModel):
    id: str
    start: float
    end: float
    text: str
    speaker: Optional[str] = "Speaker 1"
    words: Optional[List[TranscriptWordModel]] = None

class NormalizedTranscriptModel(BaseModel):
    video_id: str
    duration: float
    segments: List[TranscriptSegmentModel] = Field(default_factory=list)
    total_words: int = 0
    version: str = "1.0"
    created_at: Optional[str] = None

class TranscriptChunkModel(BaseModel):
    index: int
    start_time: float
    end_time: float
    duration: float
    segments: List[TranscriptSegmentModel] = Field(default_factory=list)
    text: str
    overlap_prev_seconds: float = 0.0
    overlap_next_seconds: float = 0.0
