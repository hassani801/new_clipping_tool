from app.models.engine import EngineInput
from app.models.job import ClipSettingsModel
from app.services.openshort_adapter import build_environment


def _input(provider: str) -> EngineInput:
    return EngineInput(
        job_id="job_1",
        input_path="in.mp4",
        output_directory="out",
        settings=ClipSettingsModel(),
        transcript_provider=provider,
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
