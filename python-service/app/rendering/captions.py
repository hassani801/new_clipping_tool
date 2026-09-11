"""Caption rendering behind a swappable interface."""
import abc
import logging
import os
from typing import Dict, List

logger = logging.getLogger("openshort.rendering.captions")


class CaptionRenderer(abc.ABC):
    name: str = "base"

    @abc.abstractmethod
    def env_overrides(self) -> Dict[str, str]:
        """Env vars that select/configure caption burn-in for a job."""

    @abc.abstractmethod
    def supported_styles(self) -> List[str]:
        """Caption styles this renderer can actually produce."""

    @abc.abstractmethod
    def describe(self) -> str:
        """Human-readable description for logs/observability."""


class OpenShortsCaptionRenderer(CaptionRenderer):
    """Delegates to OpenShorts' ASS karaoke caption burn-in.

    Captions are generated from the EXISTING timestamped transcript (never
    re-transcribed) and burned in a bottom safe-area band (or the split-layout
    seam). Only the karaoke style is implemented in the engine today; the
    planned Minimal/Bold/Cinematic styles are NOT yet built, so any requested
    style currently falls back to karaoke (logged, not fatal).
    """

    name = "openshort-captions-karaoke"

    # OpenShorts ships exactly one auto-caption style today.
    _ENGINE_STYLES = {"karaoke"}

    def __init__(self, caption_style: str = "karaoke"):
        self.caption_style = caption_style

    def env_overrides(self) -> Dict[str, str]:
        return {"AUTO_CAPTIONS": os.environ.get("AUTO_CAPTIONS", "1")}

    def supported_styles(self) -> List[str]:
        return sorted(self._ENGINE_STYLES)

    def describe(self) -> str:
        if self.caption_style.lower() not in self._ENGINE_STYLES:
            logger.warning(
                f"Caption style '{self.caption_style}' is not implemented in "
                f"OpenShorts; falling back to 'karaoke'. Supported: "
                f"{', '.join(sorted(self._ENGINE_STYLES))}."
            )
        return (
            f"OpenShorts ASS karaoke captions (requested '{self.caption_style}', "
            f"engine styles: {', '.join(sorted(self._ENGINE_STYLES))})"
        )
