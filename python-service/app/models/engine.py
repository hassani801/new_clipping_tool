from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from .job import ClipSettingsModel, JobStatus

class EngineInput(BaseModel):
    job_id: str
    input_path: str
    output_directory: str
    settings: ClipSettingsModel
    # Transcript provider for the OpenShorts subprocess ("faster_whisper" |
    # "deepgram") — resolved from the user's tier before the job was queued.
    transcript_provider: str = "faster_whisper"

class EngineClipResult(BaseModel):
    id: str
    title: str
    start_time: float
    end_time: float
    duration: float
    score: int
    output_path: Optional[str] = None
    hook_summary: Optional[str] = None
    thumbnail_path: Optional[str] = None
    captions: Optional[List[Dict[str, Any]]] = None

class EngineError(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None

class EngineOutput(BaseModel):
    job_id: str
    status: JobStatus
    clips: List[EngineClipResult] = Field(default_factory=list)
    error: Optional[EngineError] = None
    # Per-stage wall-clock timings ({"stage": str, "durationMs": int}), captured
    # from the OpenShorts subprocess' own stage markers — queryable, not just logged.
    stage_timings: List[Dict[str, Any]] = Field(default_factory=list)
    # Source characteristics captured for later timing correlation.
    input_meta: Dict[str, Any] = Field(default_factory=dict)
