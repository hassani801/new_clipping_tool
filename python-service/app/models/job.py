from enum import Enum
from typing import Optional, Dict, Any, List, Union
from pydantic import BaseModel, Field

class JobStage(str, Enum):
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    INITIALIZING = "initializing"
    ANALYZING = "analyzing"
    TRANSCRIBING = "transcribing"
    FINDING_MOMENTS = "finding_moments"
    CLIPPING = "clipping"
    REFRAMING = "reframing"
    CAPTIONS = "captions"
    FINALIZING = "finalizing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ClipSettingsModel(BaseModel):
    aspectRatio: str = Field(default="9:16", description="Target aspect ratio (9:16, 1:1, 16:9)")
    clipCount: Union[int, str] = Field(default=5, description="Number of candidate clips to produce (int or 'auto')")
    targetDuration: str = Field(default="medium", description="Duration target: short (15-30s), medium (30-60s), long (60-90s)")
    contentStyle: str = Field(default="podcast", description="Style: podcast, educational, gaming, interview, comedy")
    captionStyle: str = Field(default="karaoke", description="Subtitles style: karaoke")
    hookThreshold: Optional[int] = Field(default=75, description="Virality score threshold (0-100)")
    autoFaceReframing: Optional[bool] = Field(default=True)
    bRollSuggestions: Optional[bool] = Field(default=True)
    highlightKeywords: Optional[bool] = Field(default=True)
    removeFillerWords: Optional[bool] = Field(default=True)
    dynamicEmojis: Optional[bool] = Field(default=True)

class CreateJobRequest(BaseModel):
    jobId: str
    videoId: str
    # Requesting user's id. With real backend auth wired, this is the NestJS
    # user id; tier/provider below are authoritative when provided.
    userId: Optional[str] = None
    # Explicit tier resolved by the calling backend ("free" | "paid").
    # Authoritative when present; otherwise the local tier stub
    # (PAID_USER_IDS) applies.
    tier: Optional[str] = None
    # Explicit transcription provider resolved by the calling backend
    # ("faster_whisper" | "deepgram"). Authoritative when present; otherwise
    # tier-driven selection applies.
    transcriptionProvider: Optional[str] = None
    # Local-shared-disk input reference (relative upload name or absolute path).
    inputPath: str = ""
    # Object-storage / remote input reference the service downloads itself.
    inputUrl: Optional[str] = None
    # YouTube (or other yt-dlp-supported) URL the service downloads into the
    # job input directory. Mutually exclusive with inputPath/inputUrl.
    sourceUrl: Optional[str] = None
    settings: ClipSettingsModel

class JobAcceptResponse(BaseModel):
    jobId: str
    status: str = "accepted"

class JobStatusResponse(BaseModel):
    jobId: str
    status: JobStatus
    progress: int
    stage: JobStage
    message: str
    durationSeconds: Optional[float] = None
    # Transcript provider this job will run with (tier-selected or env-forced).
    provider: Optional[str] = None

class ClipResultModel(BaseModel):
    id: str
    title: str
    startTime: float
    endTime: float
    duration: float
    score: int
    hookSummary: Optional[str] = None
    captions: Optional[List[Dict[str, Any]]] = None
    clipUrl: Optional[str] = None
    outputPath: Optional[str] = None

class JobResultResponse(BaseModel):
    jobId: str
    status: JobStatus
    clips: List[ClipResultModel] = Field(default_factory=list)
    error: Optional[Dict[str, Any]] = None
    stageTimings: List[Dict[str, Any]] = Field(default_factory=list)
    inputMeta: Dict[str, Any] = Field(default_factory=dict)
