"""Video encoding behind a swappable interface."""
import abc
import os
from typing import Dict


class VideoEncoder(abc.ABC):
    name: str = "base"

    @abc.abstractmethod
    def env_overrides(self) -> Dict[str, str]:
        """Env vars that select/configure the encoder for a job."""

    @abc.abstractmethod
    def describe(self) -> str:
        """Human-readable description for logs/observability."""


class FFmpegEncoder(VideoEncoder):
    """Delegates to OpenShorts' ffmpeg_utils encoder selection.

    OpenShorts centralizes encoder choice (x264 default, NVENC optional), quality
    tiers (crf 18 fast preset), loudness normalization (loudnorm) and +faststart
    in ffmpeg_utils.py. This strategy only selects the encoder — it does not
    reimplement any encode logic.
    """

    name = "ffmpeg"

    def __init__(self, encoder: str = "auto"):
        self.encoder = encoder

    def env_overrides(self) -> Dict[str, str]:
        chosen = self.encoder if self.encoder != "auto" else os.environ.get("FFMPEG_ENCODER", "x264")
        return {"FFMPEG_ENCODER": chosen}

    def describe(self) -> str:
        chosen = self.env_overrides()["FFMPEG_ENCODER"]
        return f"OpenShorts ffmpeg encoder ({chosen}; crf 18 fast preset, loudnorm, +faststart)"
