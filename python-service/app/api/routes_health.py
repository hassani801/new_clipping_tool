import shutil
from fastapi import APIRouter
from ..config import settings
from ..storage import get_storage_backend

router = APIRouter(tags=["Health"])


def _ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def _disk_free_bytes() -> int:
    try:
        usage = shutil.disk_usage(settings.STORAGE_ROOT)
        return usage.free
    except Exception:
        return -1


@router.get("/health")
def get_health():
    """
    Liveness + readiness probe for deployment platforms. Reports whether the
    service can reach its configured dependencies (ffmpeg, storage, Gemini key
    presence) so a load balancer can drop an unhealthy instance.
    """
    gemini_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "MY_GEMINI_API_KEY")

    backend = get_storage_backend()
    ffmpeg = _ffmpeg_available()

    healthy = ffmpeg and backend is not None

    return {
        "status": "ok" if healthy else "degraded",
        "stage": settings.STAGE_NAME,
        "engine": settings.ENGINE_TYPE,
        "version": "0.5.0-service",
        "storageBackend": backend.name,
        "ffmpegAvailable": ffmpeg,
        "geminiConfigured": gemini_configured,
        "maxConcurrentJobs": settings.MAX_CONCURRENT_JOBS,
        "diskFreeBytes": _disk_free_bytes(),
    }
