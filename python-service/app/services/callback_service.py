import json
import logging
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from ..config import settings
from ..models.engine import EngineOutput
from ..models.job import JobStatus

logger = logging.getLogger("openshort.callback")

class CallbackService:
    def __init__(
        self,
        base_url: str = settings.BACKEND_INTERNAL_URL,
        secret: str = settings.PYTHON_ENGINE_SECRET
    ):
        self.base_url = base_url.rstrip("/")
        self.secret = secret

    def _clip_url(self, job_id: str, output_path: Optional[str]) -> Optional[str]:
        """Absolute URL for a clip, based on the storage backend's public URL."""
        if not output_path:
            return None
        from pathlib import Path
        from ..storage import get_storage_backend
        filename = Path(output_path).name
        return get_storage_backend().clip_public_url(job_id, filename)

    async def notify_job_result(self, engine_output: EngineOutput) -> bool:
        """
        Sends completed/failed job outcome to the NestJS internal callback:
        POST /api/internal/jobs/{jobId}/result
        """
        url = f"{self.base_url}/api/internal/jobs/{engine_output.job_id}/result"
        
        payload: Dict[str, Any] = {
            "jobId": engine_output.job_id,
            "status": engine_output.status.value,
            "stageTimings": engine_output.stage_timings,
            "inputMeta": engine_output.input_meta,
            "clips": [
                {
                    "id": c.id,
                    "title": c.title,
                    "startTime": c.start_time,
                    "endTime": c.end_time,
                    "duration": c.duration,
                    "score": c.score,
                    "outputPath": c.output_path,
                    "clipUrl": self._clip_url(engine_output.job_id, c.output_path),
                    "hookSummary": c.hook_summary,
                    "thumbnailPath": c.thumbnail_path,
                    "captions": c.captions
                }
                for c in engine_output.clips
            ]
        }

        if engine_output.error:
            error_payload = {
                "code": engine_output.error.code,
                "message": engine_output.error.message,
            }
            if engine_output.error.details:
                error_payload["details"] = engine_output.error.details
            payload["error"] = error_payload

        headers = {
            "Content-Type": "application/json",
            "X-Engine-Secret": self.secret,
            "Authorization": f"Bearer {self.secret}"
        }

        logger.info(f"[JOB] {engine_output.job_id} sending callback to {url}")

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status in (200, 201, 204):
                    logger.info(f"[JOB] {engine_output.job_id} callback acknowledged successfully")
                    return True
                else:
                    logger.warning(f"[JOB] {engine_output.job_id} callback responded with status {response.status}")
                    return False
        except urllib.error.HTTPError as e:
            logger.error(f"[JOB] {engine_output.job_id} callback HTTP error: {e.code} {e.reason}")
            return False
        except Exception as e:
            logger.warning(f"[JOB] {engine_output.job_id} callback request failed (Next.js may poll): {e}")
            return False

default_callback_service = CallbackService()
