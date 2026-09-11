"""TranscriptProvider interface and its two implementations.

The whole pipeline consumes ONE transcript shape (Gemini correction, moment
detection, clip cutting, karaoke subtitles, Remotion):

    {
      "text": str,          # full punctuated transcript
      "language": str,      # whisper-style short code ("es", "en", ...)
      "segments": [
        {"start": float, "end": float, "text": str,
         "words": [{"word": str, "start": float, "end": float}, ...]},
      ],
    }

Invariants every provider must honor:
  - word["word"] carries a LEADING SPACE on true word starts; continuation
    fragments are merged into their base word (merge_continuation_words).
  - all numerics are native Python floats (json.dump of the transcript).
  - words sorted by start, segments chronological, absolute file timestamps.

Providers:
  - FasterWhisperProvider: wraps the self-hosted faster-whisper path in
    transcribe_backends (unchanged behavior).
  - DeepgramProvider: Deepgram's pre-recorded (batch) speech-to-text API.
    Batch means one request/response, so progress is honest 0% -> 100%.

Selection is manual for now via the TRANSCRIPT_PROVIDER env var
("faster_whisper" (default) | "deepgram"). Tier-based auto-selection is a
later step; this module only provides the swappable implementations.
"""
import os
import time
from abc import ABC, abstractmethod
from typing import Callable, Dict, List, Optional

try:
    from typing import TypedDict
except ImportError:  # pragma: no cover - python 3.7
    from typing_extensions import TypedDict

ProgressCallback = Callable[[float], None]
"""Receives the transcription progress as a percent float (0.0-100.0)."""


class TranscriptResult(TypedDict):
    """The transcript contract every provider returns (see module docstring)."""

    text: str
    language: str
    segments: List[Dict]


class TranscriptProvider(ABC):
    """Swappable transcription backend.

    transcribe() takes a local media path (audio or video — the provider
    decides whether it needs to demux audio first) and returns a
    TranscriptResult. on_progress is optional; when given it receives honest
    percent progress (0.0-100.0). User-facing "🎙️ Transcribing… NN%" lines
    are additionally printed to stdout because the SaaS adapter parses them.
    """

    name: str = "transcript"

    @abstractmethod
    def transcribe(
        self,
        input_path: str,
        on_progress: Optional[ProgressCallback] = None,
    ) -> TranscriptResult:
        ...


def _detect_language(text):
    """Classify the transcribed text when the provider doesn't report one.

    py3langid is pure-Python and returns ISO 639-1 codes compatible with the
    whisper codes the pipeline expects (thumbnail titles, Gemini prompts).
    """
    sample = (text or "").strip()
    if len(sample) < 20:
        return "en"
    try:
        import py3langid
        lang, _score = py3langid.classify(sample[:4000])
        return lang
    except Exception:
        return "en"


# --- faster-whisper ---------------------------------------------------------

class FasterWhisperProvider(TranscriptProvider):
    """The self-hosted CTranslate2 whisper backend.

    Deliberately a thin adapter over transcribe_backends' existing whisper
    path (singleton model, GPU->CPU fallback, progress markers) so this
    refactor changes no behavior.
    """

    name = "faster_whisper"

    def transcribe(self, input_path, on_progress=None):
        from transcribe_backends import _transcribe_with_whisper
        if on_progress is None:
            return _transcribe_with_whisper(input_path)
        return _transcribe_with_whisper(input_path, on_progress=on_progress)


# --- deepgram ---------------------------------------------------------------

class DeepgramProvider(TranscriptProvider):
    """Deepgram pre-recorded (batch) speech-to-text.

    One request/response per job: progress is reported as an honest
    0% (before submitting) -> 100% (on response). Requires DEEPGRAM_API_KEY.
    Deepgram accepts common audio AND video containers, so the media file is
    uploaded as-is (no ffmpeg demux needed).
    """

    name = "deepgram"

    def __init__(self):
        self.api_key = (os.environ.get("DEEPGRAM_API_KEY") or "").strip()

    def transcribe(self, input_path, on_progress=None):
        if not self.api_key:
            raise RuntimeError(
                "DEEPGRAM_API_KEY is not set. The deepgram transcript provider "
                "needs it; set it in the environment (or switch "
                "TRANSCRIPT_PROVIDER back to faster_whisper).")
        from deepgram import DeepgramClient

        with open(input_path, "rb") as f:
            payload = f.read()

        client = DeepgramClient(api_key=self.api_key)
        started = time.time()
        print("🎙️ Transcribing… 0% (0s)", flush=True)
        if on_progress:
            on_progress(0.0)
        response = client.listen.v1.media.transcribe_file(
            request=payload,
            # Words carry start/end times by default; utterances groups them
            # into sentence-level segments (start/end/transcript). smart_format
            # adds punctuation/casing and punctuated_word on each word.
            utterances=True,
            smart_format=True,
            punctuate=True,
            detect_language=True,
            request_options={"timeout": 900.0},
        )
        elapsed = int(time.time() - started)
        print(f"🎙️ Transcribing… 100% ({elapsed}s)", flush=True)
        if on_progress:
            on_progress(100.0)

        transcript = self._to_transcript(response)
        metadata = getattr(response, "metadata", None)
        request_id = getattr(metadata, "request_id", "?") if metadata else "?"
        duration = float(getattr(metadata, "duration", 0) or 0) if metadata else 0.0
        print(f"🎙️ [ASR] deepgram ok: lang={transcript['language']} "
              f"segments={len(transcript['segments'])} request_id={request_id} "
              f"audio={duration:.1f}s")
        return transcript

    @staticmethod
    def _words(raw_words):
        """Map Deepgram word objects to the pipeline word contract.

        Deepgram words have no leading-space convention (unlike whisper's
        tokens), so one is added to every word: merge_continuation_words()
        then keeps each word separate, exactly like whisper output.
        punctuated_word is preferred so punctuation stays glued to the word
        the way whisper's tokens do.
        """
        words = []
        for w in raw_words or []:
            start = getattr(w, "start", None)
            end = getattr(w, "end", None)
            if start is None or end is None:
                continue
            text = getattr(w, "punctuated_word", None) or getattr(w, "word", None)
            text = (text or "").strip()
            if not text:
                continue
            words.append({"word": " " + text, "start": float(start), "end": float(end)})
        return words

    def _to_transcript(self, response):
        """Convert a Deepgram pre-recorded response into a TranscriptResult."""
        results = getattr(response, "results", None)
        channels = getattr(results, "channels", None) or []
        detected = None
        channel_words = []
        if channels:
            channel = channels[0]
            detected = getattr(channel, "detected_language", None)
            alt = (getattr(channel, "alternatives", None) or [None])[0]
            if alt is not None:
                channel_words = getattr(alt, "words", None) or []

        segments = []
        utterances = getattr(results, "utterances", None) or []
        for utt in utterances:
            if getattr(utt, "start", None) is None or getattr(utt, "end", None) is None:
                continue
            words = self._words(getattr(utt, "words", None))
            text = (getattr(utt, "transcript", None) or "").strip()
            if not words and not text:
                continue
            segments.append({
                "start": float(utt.start),
                "end": float(utt.end),
                "text": text,
                "words": words,
            })

        if not segments and channel_words:
            # utterances are expected on, but degrade to a single segment
            # from the channel-level words instead of returning nothing.
            words = self._words(channel_words)
            if words:
                segments.append({
                    "start": words[0]["start"],
                    "end": words[-1]["end"],
                    "text": " ".join(w["word"].strip() for w in words),
                    "words": words,
                })

        if not segments:
            print("⚠️ [ASR] deepgram returned no words", flush=True)

        text = " ".join(s["text"] for s in segments if s["text"])
        return {
            "text": text,
            "language": detected or _detect_language(text),
            "segments": segments,
        }


# --- selection --------------------------------------------------------------

def get_transcript_provider() -> TranscriptProvider:
    """Instantiate the provider named by TRANSCRIPT_PROVIDER (manual switch).

    Temporary until tier-based auto-selection lands; the env var exists so
    Deepgram can be tested end-to-end before that logic exists.
    """
    name = (os.environ.get("TRANSCRIPT_PROVIDER") or "faster_whisper").strip().lower()
    if name in ("faster_whisper", "faster-whisper", "whisper"):
        return FasterWhisperProvider()
    if name == "deepgram":
        return DeepgramProvider()
    raise ValueError(
        f"Unknown TRANSCRIPT_PROVIDER '{name}' — expected 'faster_whisper' "
        "or 'deepgram'")
