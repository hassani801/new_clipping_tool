import sys
import types
from types import SimpleNamespace

import pytest

import transcript_providers as tp
import transcribe_backends as tb


# --- provider selection -----------------------------------------------------

def test_default_provider_is_faster_whisper(monkeypatch):
    monkeypatch.delenv("TRANSCRIPT_PROVIDER", raising=False)
    assert isinstance(tp.get_transcript_provider(), tp.FasterWhisperProvider)


def test_deepgram_provider_selected_by_env(monkeypatch):
    monkeypatch.setenv("TRANSCRIPT_PROVIDER", "deepgram")
    assert isinstance(tp.get_transcript_provider(), tp.DeepgramProvider)


def test_whisper_alias_selected_by_env(monkeypatch):
    monkeypatch.setenv("TRANSCRIPT_PROVIDER", "whisper")
    assert isinstance(tp.get_transcript_provider(), tp.FasterWhisperProvider)


def test_unknown_provider_raises(monkeypatch):
    monkeypatch.setenv("TRANSCRIPT_PROVIDER", "google")
    with pytest.raises(ValueError):
        tp.get_transcript_provider()


# --- deepgram response conversion -------------------------------------------

def _word(text, start, end, punctuated=None):
    return SimpleNamespace(
        word=text, start=start, end=end, confidence=0.99,
        punctuated_word=punctuated)


def _response(detected_language="en", utterances=None, channel_words=None):
    utterances = [SimpleNamespace(
        start=u[0], end=u[1], transcript=u[2],
        words=[_word(w[0], w[1], w[2], w[3] if len(w) > 3 else None)
               for w in u[3]])
        for u in (utterances or [])]
    alt = SimpleNamespace(words=channel_words or [])
    channel = SimpleNamespace(
        detected_language=detected_language, alternatives=[alt])
    results = SimpleNamespace(channels=[channel], utterances=utterances)
    return SimpleNamespace(
        metadata=SimpleNamespace(request_id="abc", duration=10.0),
        results=results)


def test_deepgram_utterances_map_to_pipeline_contract():
    resp = _response(
        detected_language="en",
        utterances=[
            (0.5, 2.0, "Hello world.",
             [("Hello", 0.5, 0.7, "Hello"), ("world.", 0.9, 1.4, "world.")]),
            (2.5, 3.5, "Next sentence",
             [("Next", 2.5, 2.8, "Next"), ("sentence", 3.0, 3.5, "sentence")]),
        ],
    )
    t = tp.DeepgramProvider()._to_transcript(resp)

    assert t["language"] == "en"
    assert t["text"] == "Hello world. Next sentence"
    assert len(t["segments"]) == 2

    seg = t["segments"][0]
    assert seg["start"] == 0.5 and seg["end"] == 2.0
    assert seg["text"] == "Hello world."
    # Leading-space convention + punctuated_word + native floats, like whisper.
    assert seg["words"] == [
        {"word": " Hello", "start": 0.5, "end": 0.7},
        {"word": " world.", "start": 0.9, "end": 1.4},
    ]
    for w in seg["words"]:
        assert type(w["start"]) is float and type(w["end"]) is float


def test_deepgram_words_fall_back_to_plain_word_without_punctuation():
    words = tp.DeepgramProvider._words([
        _word("  Hello ", 0.5, 0.7, None),
        _word("", 0.9, 1.0, None),   # empty word is skipped
    ])
    assert words == [{"word": " Hello", "start": 0.5, "end": 0.7}]


def test_deepgram_language_falls_back_to_detection(monkeypatch):
    monkeypatch.setattr(tp, "_detect_language", lambda text: "es")
    resp = _response(
        detected_language=None,
        utterances=[(0.5, 2.0, "Hola mundo.", [("Hola", 0.5, 0.7),
                                              ("mundo.", 0.9, 1.4)])],
    )
    t = tp.DeepgramProvider()._to_transcript(resp)
    assert t["language"] == "es"


def test_deepgram_degrades_to_channel_words_without_utterances():
    resp = _response(
        detected_language="en",
        utterances=[],
        channel_words=[_word("Only", 0.5, 0.7, "Only"),
                       _word("words.", 0.9, 1.4, "words.")],
    )
    t = tp.DeepgramProvider()._to_transcript(resp)
    assert len(t["segments"]) == 1
    assert t["segments"][0]["start"] == 0.5
    assert t["segments"][0]["end"] == 1.4
    assert t["segments"][0]["words"][0]["word"] == " Only"


def test_deepgram_empty_result_yields_empty_transcript():
    t = tp.DeepgramProvider()._to_transcript(_response(utterances=[], channel_words=[]))
    assert t == {"text": "", "language": "en", "segments": []}


def test_deepgram_words_survive_merge_continuation_words():
    from subtitles import merge_continuation_words
    resp = _response(
        utterances=[(0.5, 3.0, "One two three.",
                     [("One", 0.5, 0.7), ("two", 1.0, 1.2), ("three.", 1.5, 2.0)])],
    )
    t = tp.DeepgramProvider()._to_transcript(resp)
    seg_words = t["segments"][0]["words"]
    assert merge_continuation_words(seg_words) == seg_words


# --- provider behaviors -----------------------------------------------------

def test_deepgram_provider_requires_api_key(monkeypatch):
    monkeypatch.delenv("DEEPGRAM_API_KEY", raising=False)
    with pytest.raises(RuntimeError):
        tp.DeepgramProvider().transcribe("video.mp4")


def test_faster_whisper_provider_delegates_to_backends_module(monkeypatch):
    sentinel = {"text": "ok", "language": "en", "segments": []}
    calls = []

    def fake_transcribe(path, on_progress=None):
        calls.append((path, on_progress))
        return sentinel

    monkeypatch.setattr(tb, "_transcribe_with_whisper", fake_transcribe)
    provider = tp.FasterWhisperProvider()
    assert provider.transcribe("video.mp4") is sentinel
    assert calls == [("video.mp4", None)]


def test_transcribe_media_routes_to_selected_provider(monkeypatch):
    sentinel = {"text": "ok", "language": "en", "segments": []}
    seen = {}

    class FakeProvider(tp.TranscriptProvider):
        name = "fake"

        def transcribe(self, input_path, on_progress=None):
            seen["path"] = input_path
            seen["on_progress"] = on_progress
            return sentinel

    monkeypatch.delenv("TRANSCRIBE_BACKEND", raising=False)
    monkeypatch.setattr(tb, "_has_audio_stream", lambda path: True)
    monkeypatch.setattr(tb, "get_transcript_provider", lambda: FakeProvider())
    progress = []

    def _progress(pct):
        progress.append(pct)

    assert tb.transcribe_media("video.mp4", on_progress=_progress) is sentinel
    assert seen["path"] == "video.mp4"
    assert seen["on_progress"] is _progress


def test_transcribe_progress_emits_callback(monkeypatch, capsys):
    collected = []
    progress = tb._TranscribeProgress(100.0, on_progress=collected.append)
    progress.update(50.0)
    progress.update(100.0)
    assert collected == [25.0, 50.0, 75.0, 100.0]
    # stdout markers still print (the SaaS adapter parses them).
    out = capsys.readouterr().out
    assert "🎙️ Transcribing… 50%" in out
    assert "🎙️ Transcribing… 100%" in out


# --- deepgram against the REAL SDK response models ---------------------------

def test_deepgram_maps_real_sdk_response_models():
    deepgram_types = pytest.importorskip("deepgram.types")
    from deepgram.types import (
        ListenV1Response,
        ListenV1ResponseMetadata,
        ListenV1ResponseResults,
        ListenV1ResponseResultsChannels,
        ListenV1ResponseResultsChannelsItem,
        ListenV1ResponseResultsChannelsItemAlternativesItem,
        ListenV1ResponseResultsChannelsItemAlternativesItemWordsItem,
        ListenV1ResponseResultsUtterances,
        ListenV1ResponseResultsUtterancesItem,
        ListenV1ResponseResultsUtterancesItemWordsItem,
    )

    # Response shape per Deepgram's pre-recorded API docs.
    raw = {
        "metadata": {
            "request_id": "c40b5ba1-...", "sha256": "...", "created": "2026-09-08T00:00:00Z",
            "duration": 2.0, "channels": 1, "models": ["nova-3"], "model_info": {},
        },
        "results": {
            "channels": [{
                "alternatives": [{
                    "transcript": "Hello world. Next sentence",
                    "confidence": 0.99,
                    "words": [
                        {"word": "Hello", "start": 0.5, "end": 0.7, "confidence": 0.99,
                         "punctuated_word": "Hello"},
                        {"word": "world", "start": 0.9, "end": 1.4, "confidence": 0.99,
                         "punctuated_word": "world."},
                        {"word": "Next", "start": 2.5, "end": 2.8, "confidence": 0.98,
                         "punctuated_word": "Next"},
                        {"word": "sentence", "start": 3.0, "end": 3.5, "confidence": 0.98,
                         "punctuated_word": "sentence"},
                    ],
                }],
                "detected_language": "en",
            }],
            "utterances": [
                {"start": 0.5, "end": 1.4, "confidence": 0.99, "channel": 0,
                 "transcript": "Hello world.",
                 "words": [
                     {"word": "Hello", "start": 0.5, "end": 0.7, "confidence": 0.99,
                      "punctuated_word": "Hello"},
                     {"word": "world", "start": 0.9, "end": 1.4, "confidence": 0.99,
                      "punctuated_word": "world."},
                 ]},
                {"start": 2.5, "end": 3.5, "confidence": 0.98, "channel": 0,
                 "transcript": "Next sentence",
                 "words": [
                     {"word": "Next", "start": 2.5, "end": 2.8, "confidence": 0.98,
                      "punctuated_word": "Next"},
                     {"word": "sentence", "start": 3.0, "end": 3.5, "confidence": 0.98,
                      "punctuated_word": "sentence"},
                 ]},
            ],
        },
    }
    response = ListenV1Response.model_validate(raw)

    t = tp.DeepgramProvider()._to_transcript(response)
    assert t["language"] == "en"
    assert t["text"] == "Hello world. Next sentence"
    assert [s["text"] for s in t["segments"]] == ["Hello world.", "Next sentence"]
    assert t["segments"][0]["words"] == [
        {"word": " Hello", "start": 0.5, "end": 0.7},
        {"word": " world.", "start": 0.9, "end": 1.4},
    ]


# --- deepgram transcribe() flow with a mocked client -------------------------

def test_deepgram_transcribe_flow_and_progress(monkeypatch, tmp_path, capsys):
    captured = {}

    def fake_transcribe_file(request=None, **kwargs):
        captured["payload"] = request
        captured["kwargs"] = kwargs
        return _response(
            detected_language="en",
            utterances=[(0.5, 1.5, "Hello world.",
                         [("Hello", 0.5, 0.7, "Hello"),
                          ("world.", 0.9, 1.4, "world.")])],
        )

    fake_client = SimpleNamespace(
        listen=SimpleNamespace(
            v1=SimpleNamespace(
                media=SimpleNamespace(transcribe_file=fake_transcribe_file))))
    fake_module = SimpleNamespace(DeepgramClient=lambda api_key: fake_client)
    monkeypatch.setitem(sys.modules, "deepgram", fake_module)
    monkeypatch.setenv("DEEPGRAM_API_KEY", "test-key")

    media = tmp_path / "video.mp4"
    media.write_bytes(b"fake-video-bytes")

    progress = []
    t = tp.DeepgramProvider().transcribe(str(media), on_progress=progress.append)

    assert captured["payload"] == b"fake-video-bytes"
    opts = captured["kwargs"]
    assert opts["utterances"] is True
    assert opts["smart_format"] is True
    assert opts["punctuate"] is True
    assert opts["detect_language"] is True
    assert opts["request_options"] == {"timeout": 900.0}
    assert t["text"] == "Hello world."
    # Batch API: honest 0% -> 100%, no fabricated increments.
    assert progress == [0.0, 100.0]
    out = capsys.readouterr().out
    assert "🎙️ Transcribing… 0% (0s)" in out
    assert "🎙️ Transcribing… 100%" in out
