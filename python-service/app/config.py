import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel

# Load .env from the python-service directory so OPENSHORT_PYTHON and friends
# are picked up when the service runs without an exported environment.
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

def _resolve_storage_root(raw: str) -> str:
    """Make STORAGE_ROOT absolute and CWD-independent.

    A relative value (e.g. ``../storage``) is resolved against the
    python-service directory (this file lives in python-service/app/), not the
    process CWD, so starting the service from any directory yields the same
    storage root.
    """
    p = Path(raw)
    if not p.is_absolute():
        p = Path(os.path.dirname(__file__)).parent / p
    return str(p.resolve())


class Settings(BaseModel):
    PYTHON_ENGINE_SECRET: str = os.getenv("PYTHON_ENGINE_SECRET", "change-me-secret-token")
    STORAGE_ROOT: str = _resolve_storage_root(
        os.getenv("STORAGE_ROOT", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../storage")))
    )
    # Internal callback target for job results (NestJS backend on :3001).
    BACKEND_INTERNAL_URL: str = (
        os.getenv("BACKEND_INTERNAL_URL")
        or "http://127.0.0.1:3001"
    )
    ENGINE_TYPE: str = os.getenv("ENGINE_TYPE", "openshort")
    PORT: int = int(os.getenv("PYTHON_PORT") or os.getenv("PYTHON_ENGINE_PORT") or os.getenv("PORT") or "8001")
    HOST: str = os.getenv("HOST", "0.0.0.0")

    # Path to the headless video engine (engine/main.py). Defaults to the
    # sibling engine/ folder at the workspace root (python-service/app ->
    # python-service -> workspace root -> engine).
    OPENSHORT_ROOT: str = os.getenv(
        "OPENSHORT_ROOT",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../engine")),
    )

    # Interpreter that runs OpenShorts' main.py. Defaults to this service's own
    # interpreter; point it at OpenShorts' own venv to keep its heavy
    # dependencies (torch, whisper, mediapipe, ultralytics, transnetv2) isolated.
    OPENSHORT_PYTHON: str = os.getenv("OPENSHORT_PYTHON", sys.executable)

    # Passed through to the OpenShorts subprocess for Gemini analysis.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # yt-dlp source-download controls. YTDLP_MAX_HEIGHT caps the downloaded
    # stream height (best video+audio under it); MAX_SOURCE_VIDEO_DURATION_SECONDS
    # rejects videos that are too long (0 = no limit) before downloading.
    YTDLP_MAX_HEIGHT: int = int(os.getenv("YTDLP_MAX_HEIGHT", "1080"))
    MAX_SOURCE_VIDEO_DURATION_SECONDS: int = int(
        os.getenv("MAX_SOURCE_VIDEO_DURATION_SECONDS", "10800")
    )

    # --- Tier controls (stub user model; see services/tier_service.py) -------
    # Gate flag: must be "1" or "true" to allow PAID_USER_IDS override.
    # NEVER enable in production — tier is authoritative from the Nest request body.
    DEV_ALLOW_PAID_USER_IDS: bool = os.getenv("DEV_ALLOW_PAID_USER_IDS", "0").lower() in ("1", "true")
    # Comma-separated user ids treated as "paid" — only used when DEV_ALLOW_PAID_USER_IDS=1.
    PAID_USER_IDS: str = os.getenv("PAID_USER_IDS", "") if os.getenv("DEV_ALLOW_PAID_USER_IDS", "0").lower() in ("1", "true") else ""
    # Free tier: max jobs started per day (in-flight + completed today).
    # Canonical name matches NestJS (FREE_TIER_DAILY_JOB_CAP).
    FREE_TIER_DAILY_JOB_CAP: int = int(
        os.getenv("FREE_TIER_DAILY_JOB_CAP")
        or "2"
    )
    # Max source duration per tier, checked before any processing starts.
    # Canonical names match NestJS (*_MAX_DURATION_SECONDS).
    FREE_TIER_MAX_DURATION_SECONDS: int = int(
        os.getenv("FREE_TIER_MAX_DURATION_SECONDS")
        or "600"
    )
    PAID_TIER_MAX_DURATION_SECONDS: int = int(
        os.getenv("PAID_TIER_MAX_DURATION_SECONDS")
        or "1800"
    )

    # Storage backend: "local" (shared/local disk, default) or "s3"
    # (S3-compatible object storage). Local is the simplest to stand up first;
    # s3 removes the shared-filesystem assumption so the service can be deployed
    # independently of the Next.js app.
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local").strip().lower()

    # Max concurrent processing jobs (in-process queue bound).
    MAX_CONCURRENT_JOBS: int = int(os.getenv("MAX_CONCURRENT_JOBS", "1"))

    # Max clips rendered in parallel inside one OpenShorts job. OpenShorts'
    # own default is 3; this service pins a more conservative 2 so multiple
    # concurrent ffmpeg encodes don't thrash the 16GB-RAM host. Tune up only
    # after benchmarking the reframe+captions stage (Phase 6 plan).
    CLIP_WORKERS: int = int(os.getenv("CLIP_WORKERS", "2"))

    # S3-compatible object storage (used when STORAGE_BACKEND=s3).
    STORAGE_BUCKET: str = os.getenv("STORAGE_BUCKET", "")
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "")
    S3_ACCESS_KEY_ID: str = os.getenv("S3_ACCESS_KEY_ID", "")
    S3_SECRET_ACCESS_KEY: str = os.getenv("S3_SECRET_ACCESS_KEY", "")
    S3_REGION: str = os.getenv("S3_REGION", "us-east-1")

    # Public base URL this service is reachable at (used to build absolute clip
    # URLs in results/callbacks). E.g. http://localhost:8001 in dev, or a real
    # host in production. Empty means the service is only reachable locally and
    # clip URLs are omitted.
    PUBLIC_BASE_URL: str = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")

    # Deployment label surfaced in /health for observability.
    STAGE_NAME: str = os.getenv("STAGE_NAME", "local")

    @property
    def uploads_dir(self) -> Path:
        p = Path(self.STORAGE_ROOT) / "uploads"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def jobs_dir(self) -> Path:
        p = Path(self.STORAGE_ROOT) / "jobs"
        p.mkdir(parents=True, exist_ok=True)
        return p

settings = Settings()
