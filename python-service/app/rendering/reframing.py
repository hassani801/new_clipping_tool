"""Smart reframing behind a swappable interface."""
import abc
import os
from typing import Dict


class ReframingStrategy(abc.ABC):
    name: str = "base"

    @abc.abstractmethod
    def env_overrides(self) -> Dict[str, str]:
        """Env vars that select/configure the reframe engine for a job."""

    @abc.abstractmethod
    def describe(self) -> str:
        """Human-readable description for logs/observability."""


class OpenShortsReframer(ReframingStrategy):
    """Delegates to OpenShorts' ffmpeg-native v2 reframe engine.

    The engine already provides temporal smoothing (SmoothedCameraman: safe-zone
    hold + linear pan + jump-confirmation) and speaker tracking (SpeakerTracker:
    identity hysteresis + switch cooldown), with a YOLO person fallback and a
    center-crop hold when no subject is detected. We select it and expose its
    tuning knobs; we do not reimplement it.
    """

    name = "openshort-reframe-v2"

    def __init__(self, aspect_ratio: str = "9:16"):
        self.aspect_ratio = aspect_ratio

    def env_overrides(self) -> Dict[str, str]:
        overrides = {
            "REFRAME_ENGINE": os.environ.get("REFRAME_ENGINE", "v2"),
            "DETECT_STRIDE": os.environ.get("DETECT_STRIDE", "4"),
            # Scene detection: pyscenedetect is ~11x faster than TransNetV2 on a
            # CPU-only box (measured 10.7s vs 120.8s for a 41.8s clip). It is the
            # default for CPU deployments; TransNetV2 remains opt-in via
            # SCENE_ENGINE=transnetv2 for GPU hosts where it is worthwhile.
            "SCENE_ENGINE": os.environ.get("SCENE_ENGINE", "pyscenedetect"),
        }
        if os.environ.get("GENERAL_CONTENT_HEIGHT_RATIO"):
            overrides["GENERAL_CONTENT_HEIGHT_RATIO"] = os.environ["GENERAL_CONTENT_HEIGHT_RATIO"]
        return overrides

    def describe(self) -> str:
        return (
            f"OpenShorts v2 ffmpeg-native reframe ({self.aspect_ratio}) with "
            f"smoothed cameraman + active-speaker tracking + center fallback"
        )
