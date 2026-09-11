import re
from fastapi import APIRouter, HTTPException, Request, status, Depends
from fastapi.responses import FileResponse
from ..models.job import (
    CreateJobRequest,
    JobAcceptResponse,
    JobStatusResponse,
    JobResultResponse,
)
from ..workers.background_worker import default_job_manager
from ..services.tier_service import default_tier_service, UserTier, UserRecord
from ..services.usage_service import default_usage_service
from ..services.media_info import probe_duration_seconds
from ..config import settings
from ..storage import get_storage_backend


def _require_engine_secret(request: Request) -> None:
    """Shared-secret gate between this service and the calling backend.

    The backend sends either ``X-Engine-Secret: <secret>`` or
    ``Authorization: Bearer <secret>``. When PYTHON_ENGINE_SECRET is empty the
    gate is disabled (explicitly configured-off), otherwise the header must
    match.
    """
    expected = settings.PYTHON_ENGINE_SECRET
    if not expected:
        return
    provided = request.headers.get("x-engine-secret", "")
    if not provided:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            provided = auth[7:].strip()
    if provided != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Engine-Secret.",
        )


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
    dependencies=[Depends(_require_engine_secret)],
)

# Conservative clip filename: single dot + whitelisted extension; blocks "..",
# "/", "\", and null bytes at the route boundary.
_CLIP_FILENAME_RE = re.compile(r"^[A-Za-z0-9_-]+\.(mp4|mov|webm)$")

_CONTENT_TYPES = {
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
}


@router.post("", response_model=JobAcceptResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_job(request: CreateJobRequest):
    """
    Submits a video processing job. Input is referenced either by ``inputPath``
    (a shared-disk path / upload name) or ``inputUrl`` (a remote/object-storage
    URL the service downloads). Returns immediately with a job_id.
    """
    if not request.jobId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="'jobId' is required.",
        )
    if not request.inputPath and not request.inputUrl and not request.sourceUrl:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One of 'inputPath', 'inputUrl', or 'sourceUrl' is required.",
        )

    # --- tier/provider resolution -------------------------------------------------
    # The calling backend (NestJS) resolves the user's real tier and passes it
    # explicitly — that value is authoritative. The local PAID_USER_IDS stub
    # only applies as a fallback for callers that predate real auth.
    explicit_tier = (request.tier or "").strip().lower()
    if explicit_tier in ("free", "paid"):
        tier = UserTier(explicit_tier)
    else:
        user = default_tier_service.get_or_create(request.userId)
        tier = user.tier

    tier_record = UserRecord(id=request.userId or "anonymous", tier=tier)
    provider = (request.transcriptionProvider or "").strip().lower()
    if not provider:
        provider = default_tier_service.select_provider(tier_record)
    max_duration = default_tier_service.max_duration_seconds(tier_record)

    # Free-tier daily job cap: usage records (completed jobs) + in-flight jobs.
    if tier == UserTier.FREE:
        used = default_usage_service.count_today(tier_record.id) \
            + default_job_manager.in_flight_count(tier_record.id)
        if used >= settings.FREE_TIER_DAILY_JOB_CAP:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "code": "FREE_TIER_DAILY_LIMIT",
                    "message": (
                        f"Free tier limit reached — "
                        f"{settings.FREE_TIER_DAILY_JOB_CAP} job(s) per day. "
                        "Wait for one to finish or upgrade to keep clipping."
                    ),
                },
            )

    # Per-tier video-length gate for local files, BEFORE anything is enqueued.
    # URL sources are gated inside the pipeline (pre-download probe).
    if request.inputPath:
        duration = probe_duration_seconds(request.inputPath)
        if duration is not None and duration > max_duration:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "code": "VIDEO_TOO_LONG_FOR_TIER",
                    "message": (
                        f"This video is {int(duration)} seconds; your "
                        f"{tier.value} tier allows up to {max_duration} seconds."
                    ),
                },
            )

    default_job_manager.enqueue_job(
        request,
        user_id=tier_record.id,
        tier=tier.value,
        provider=provider,
        max_duration_seconds=max_duration,
    )

    return JobAcceptResponse(jobId=request.jobId, status="accepted")


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Returns real-time status/stage/progress for a job."""
    job_state = default_job_manager.get_job_state(job_id)
    if not job_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found.",
        )
    return job_state


@router.get("/{job_id}/result", response_model=JobResultResponse)
async def get_job_result(job_id: str):
    """Returns final clip metadata once the job has completed (or failed)."""
    result = default_job_manager.get_job_result(job_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found.",
        )
    return result


@router.get("/{job_id}/clips/{file}")
async def get_job_clip(job_id: str, file: str):
    """Serves a produced clip file with HTTP Range support for video seeking."""
    if not _CLIP_FILENAME_RE.match(file or ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid clip filename.",
        )

    storage = get_storage_backend()
    try:
        file_path = storage.output_file_path(job_id, file)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Clip path escapes the job output directory.",
        )

    if not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clip file '{file}' not found.",
        )

    media_type = _CONTENT_TYPES.get(file_path.suffix.lower(), "application/octet-stream")
    # FileResponse supports HTTP Range (206/Content-Range) natively.
    return FileResponse(str(file_path), media_type=media_type, filename=file)


@router.delete("/{job_id}")
async def cancel_job(job_id: str):
    """Cancels an active or queued processing job."""
    success = default_job_manager.cancel_job(job_id)
    if not success:
        job_state = default_job_manager.get_job_state(job_id)
        if not job_state:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job with ID '{job_id}' not found.",
            )
        return {"jobId": job_id, "status": job_state.status, "message": "Job is already completed or inactive."}

    return {"jobId": job_id, "status": "cancelled", "message": "Job cancellation requested."}
