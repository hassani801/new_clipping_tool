"""Route-level tier enforcement tests (FastAPI TestClient, no real jobs)."""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.tier_service import TierService


def _payload(job_id="job_test_1", **overrides):
    base = {
        "jobId": job_id,
        "videoId": "vid_1",
        "inputPath": "videos/vid_1.mp4",
        "settings": {
            "aspectRatio": "9:16",
            "clipCount": 3,
            "targetDuration": "medium",
            "contentStyle": "podcast",
            "captionStyle": "bold",
        },
    }
    base.update(overrides)
    return base


@pytest.fixture
def harness(monkeypatch):
    """Isolate the route's collaborators and capture enqueue calls."""
    from app.api import routes_jobs
    from app.config import settings

    # Disable the X-Engine-Secret gate so these tests exercise tier logic
    # directly (the gate itself is a request-time dependency, not under test).
    monkeypatch.setattr(settings, "PYTHON_ENGINE_SECRET", "")

    captured = {}

    tier_service = TierService(paid_user_ids=["paid_1"])
    monkeypatch.setattr(routes_jobs, "default_tier_service", tier_service)
    monkeypatch.setattr(routes_jobs, "default_usage_service", _FakeUsage())
    monkeypatch.setattr(routes_jobs, "default_job_manager", _FakeManager(captured))
    monkeypatch.setattr(routes_jobs, "probe_duration_seconds", lambda path: None)
    yield routes_jobs, captured


class _FakeUsage:
    def __init__(self):
        self.today_count = 0

    def count_today(self, user_id):
        return self.today_count


class _FakeManager:
    def __init__(self, captured):
        self.in_flight = 0
        self.enqueued = []
        self.captured = captured

    def in_flight_count(self, user_id):
        return self.in_flight

    def enqueue_job(self, request, **kwargs):
        self.enqueued.append((request.jobId, kwargs))
        self.captured.update(kwargs)


def test_free_user_selects_faster_whisper(harness):
    routes, captured = harness
    client = TestClient(app)
    res = client.post("/jobs", json=_payload(userId="free_1"))
    assert res.status_code == 202
    assert captured["provider"] == "faster_whisper"
    assert captured["watermark_enabled"] is True
    assert captured["tier"] == "free"
    assert captured["user_id"] == "free_1"


def test_paid_user_selects_deepgram(harness):
    routes, captured = harness
    client = TestClient(app)
    res = client.post("/jobs", json=_payload(userId="paid_1"))
    assert res.status_code == 202
    assert captured["provider"] == "deepgram"
    assert captured["watermark_enabled"] is False
    assert captured["tier"] == "paid"
    assert captured["max_duration_seconds"] == 1800


def test_env_provider_override_forces_provider_for_all_tiers(harness, monkeypatch):
    routes, captured = harness
    monkeypatch.setenv("TRANSCRIPT_PROVIDER", "deepgram")
    client = TestClient(app)
    res = client.post("/jobs", json=_payload(userId="free_1"))
    assert res.status_code == 202
    assert captured["provider"] == "deepgram"
    assert captured["tier"] == "free"


def test_free_tier_limit_rejects_with_clear_error(harness):
    routes, captured = harness
    routes.default_usage_service.today_count = 2  # limit reached
    client = TestClient(app)
    res = client.post("/jobs", json=_payload(userId="free_1"))
    assert res.status_code == 429
    detail = res.json()["detail"]
    assert detail["code"] == "FREE_TIER_DAILY_LIMIT"
    assert "2 job(s) per day" in detail["message"]


def test_free_tier_limit_counts_in_flight_jobs(harness):
    routes, captured = harness
    routes.default_usage_service.today_count = 1
    routes.default_job_manager.in_flight = 1  # together: limit reached
    client = TestClient(app)
    res = client.post("/jobs", json=_payload(userId="free_1"))
    assert res.status_code == 429


def test_free_limit_not_applied_to_paid(harness):
    routes, captured = harness
    routes.default_usage_service.today_count = 2
    client = TestClient(app)
    res = client.post("/jobs", json=_payload(userId="paid_1"))
    assert res.status_code == 202


def test_video_too_long_rejected_before_enqueue(harness):
    routes, captured = harness
    routes.probe_duration_seconds = lambda path: 750.0
    client = TestClient(app)
    res = client.post("/jobs", json=_payload(userId="free_1"))
    assert res.status_code == 422
    detail = res.json()["detail"]
    assert detail["code"] == "VIDEO_TOO_LONG_FOR_TIER"
    assert "750 seconds" in detail["message"]
    assert "free tier allows up to 600" in detail["message"]


def test_unknown_input_rejected(harness):
    client = TestClient(app)
    res = client.post("/jobs", json={"jobId": "job_x", "videoId": "v", "settings": {}})
    assert res.status_code == 400
