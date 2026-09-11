"""Pipeline-level tier enforcement and usage recording tests."""
import asyncio
from pathlib import Path
from types import SimpleNamespace

import pytest

from app.models.job import (
    ClipSettingsModel,
    CreateJobRequest,
    JobStatus,
)
from app.models.engine import EngineOutput
from app.services.usage_service import UsageService
from app.workers import background_worker as bw
from app.workers.background_worker import BackgroundJobManager, JobExecutionState


class _FakeStorage:
    def __init__(self, root: Path):
        self.root = root

    def prepare_job_directory(self, job_id):
        return {
            "input": self.root / "input",
            "working": self.root / "working",
            "outputs": self.root / "outputs",
            "metadata": self.root / "metadata",
        }

    def resolve_input_path(self, input_path, job_dirs):
        return Path(input_path)

    def publish_outputs(self, job_id):
        pass

    def cleanup_working_files(self, job_id):
        pass


class _FakeEngine:
    name = "FakeEngine"

    async def process(self, input_data, progress_callback=None):
        return EngineOutput(job_id=input_data.job_id, status=JobStatus.COMPLETED, clips=[])


class _NoopCallback:
    async def notify_job_result(self, output):
        pass


def _request(tmp_path: Path, job_id: str) -> CreateJobRequest:
    return CreateJobRequest(
        jobId=job_id,
        videoId="vid_1",
        inputPath=str(tmp_path / "input" / "src.mp4"),
        settings=ClipSettingsModel(),
    )


def _manager(tmp_path: Path, usage: UsageService, monkeypatch) -> BackgroundJobManager:
    monkeypatch.setattr(bw, "default_usage_service", usage)
    manager = BackgroundJobManager(storage=_FakeStorage(tmp_path), callback=_NoopCallback())
    manager.default_engine = _FakeEngine()
    return manager


def _usage(tmp_path: Path) -> UsageService:
    return UsageService(db_path=str(tmp_path / "usage.db"))


def test_pipeline_rejects_video_over_tier_duration(tmp_path, monkeypatch):
    monkeypatch.setattr(bw, "probe_duration_seconds", lambda path: 750.0)
    usage = _usage(tmp_path)
    manager = _manager(tmp_path, usage, monkeypatch)
    state = JobExecutionState(
        "job_dur", user_id="free_1", tier="free",
        provider="faster_whisper", max_duration_seconds=600)
    manager.jobs["job_dur"] = state

    asyncio.run(manager._run_pipeline(state, _request(tmp_path, "job_dur"), manager.default_engine))

    assert state.status == JobStatus.FAILED
    assert "750 seconds" in (state.error or "")
    assert "free tier allows up to 600" in (state.error or "")
    assert state.output is not None
    assert state.output.error.code == "VIDEO_TOO_LONG_FOR_TIER"
    # Rejected before processing started -> no usage record.
    assert usage.count_today("free_1") == 0


def test_pipeline_records_usage_on_completion(tmp_path, monkeypatch):
    monkeypatch.setattr(bw, "probe_duration_seconds", lambda path: 100.0)
    usage = _usage(tmp_path)
    manager = _manager(tmp_path, usage, monkeypatch)
    state = JobExecutionState(
        "job_ok", user_id="paid_1", tier="paid",
        provider="deepgram", max_duration_seconds=1800)
    manager.jobs["job_ok"] = state

    asyncio.run(manager._run_pipeline(state, _request(tmp_path, "job_ok"), manager.default_engine))

    assert state.status == JobStatus.COMPLETED
    records = usage.records_for("paid_1")
    assert len(records) == 1
    assert records[0].jobId == "job_ok"
    assert records[0].provider == "deepgram"
    assert records[0].durationSeconds == 100.0


def test_pipeline_passes_tier_provider_to_engine(tmp_path, monkeypatch):
    monkeypatch.setattr(bw, "probe_duration_seconds", lambda path: 50.0)
    usage = _usage(tmp_path)
    manager = _manager(tmp_path, usage, monkeypatch)
    seen = {}

    class RecordingEngine(_FakeEngine):
        async def process(self, input_data, progress_callback=None):
            seen["transcript_provider"] = input_data.transcript_provider
            return EngineOutput(job_id=input_data.job_id, status=JobStatus.COMPLETED, clips=[])

    manager.default_engine = RecordingEngine()
    state = JobExecutionState(
        "job_prov", user_id="paid_1", tier="paid",
        provider="deepgram", max_duration_seconds=1800)
    manager.jobs["job_prov"] = state

    asyncio.run(manager._run_pipeline(state, _request(tmp_path, "job_prov"), manager.default_engine))

    assert seen["transcript_provider"] == "deepgram"


def test_in_flight_count_only_counts_active_jobs():
    manager = BackgroundJobManager(storage=_FakeStorage(Path(".")), callback=_NoopCallback())
    a = JobExecutionState("j1", user_id="u1")
    b = JobExecutionState("j2", user_id="u1")
    c = JobExecutionState("j3", user_id="u2")
    b.status = JobStatus.COMPLETED
    manager.jobs = {"j1": a, "j2": b, "j3": c}
    assert manager.in_flight_count("u1") == 1
    assert manager.in_flight_count("u2") == 1
    assert manager.in_flight_count("u9") == 0
