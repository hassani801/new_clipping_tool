"""Rendering-stage abstractions.

The clip pipeline's final stages (smart reframe, caption burn, encode) are each
behind a swappable interface so they can be replaced without touching the rest
of the pipeline. The current implementations delegate to the existing OpenShorts
engine via environment overrides passed to the ``main.py`` subprocess — they do
not reimplement OpenShorts, they describe/select its behavior.
"""
from .reframing import ReframingStrategy, OpenShortsReframer
from .captions import CaptionRenderer, OpenShortsCaptionRenderer
from .encoding import VideoEncoder, FFmpegEncoder

__all__ = [
    "ReframingStrategy",
    "OpenShortsReframer",
    "CaptionRenderer",
    "OpenShortsCaptionRenderer",
    "VideoEncoder",
    "FFmpegEncoder",
]
