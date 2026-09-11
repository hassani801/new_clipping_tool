from abc import ABC, abstractmethod
from typing import Callable, Optional, Awaitable
from ..models.engine import EngineInput, EngineOutput

# Progress callback signature: (stage: str, progress: int, message: str) -> None or Coroutine
ProgressCallback = Callable[[str, int, str], Optional[Awaitable[None]]]

class BaseClipperEngine(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Name of the engine implementation."""
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        """Version of the engine."""
        pass

    @abstractmethod
    async def process(
        self,
        input_data: EngineInput,
        progress_callback: Optional[ProgressCallback] = None
    ) -> EngineOutput:
        """
        Executes the video processing pipeline from start to finish.
        Updates progress incrementally through the callback.
        """
        pass
