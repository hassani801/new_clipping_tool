from app.models.engine import EngineInput
from app.models.job import ClipSettingsModel
from app.services.openshort_adapter import build_environment


def _input(provider: str, watermark_enabled: bool = False) -> EngineInput:
    return EngineInput(
        job_id="job_1",
        input_path="in.mp4",
        output_directory="out",
        settings=ClipSettingsModel(),
        transcript_provider=provider,
        watermark_enabled=watermark_enabled,
    )


def test_tier_selected_provider_is_forwarded(monkeypatch):
    monkeypatch.delenv("TRANSCRIPT_PROVIDER", raising=False)
    env = build_environment(_input("deepgram"))
    assert env["TRANSCRIPT_PROVIDER"] == "deepgram"


def test_env_override_beats_tier_selection(monkeypatch):
    monkeypatch.setenv("TRANSCRIPT_PROVIDER", "faster_whisper")
    env = build_environment(_input("deepgram"))
    assert env["TRANSCRIPT_PROVIDER"] == "faster_whisper"


def test_defaults_to_faster_whisper_without_selection(monkeypatch):
    monkeypatch.delenv("TRANSCRIPT_PROVIDER", raising=False)
    env = build_environment(_input(""))
    assert env["TRANSCRIPT_PROVIDER"] == "faster_whisper"


def test_free_tier_job_gets_watermark(monkeypatch):
    monkeypatch.setenv("WATERMARK", "0")
    env = build_environment(_input("faster_whisper", watermark_enabled=True))
    assert env["WATERMARK"] == "1"


def test_paid_tier_job_stays_unwatermarked(monkeypatch):
    monkeypatch.setenv("WATERMARK", "1")
    env = build_environment(_input("deepgram", watermark_enabled=False))
    assert env["WATERMARK"] == "0"
