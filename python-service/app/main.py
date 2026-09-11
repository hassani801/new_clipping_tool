import sys
import asyncio
import logging

# Setup structured logging early so the loop-policy diagnostic below is emitted
# before uvicorn/FastAPI take over logging.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
)
logger = logging.getLogger("openshort.service")

# Windows: asyncio subprocess support (create_subprocess_exec / the OpenShorts
# main.py launch in openshort_adapter) requires the ProactorEventLoop. The
# SelectorEventLoop raises NotImplementedError in _make_subprocess_transport.
# This must run before uvicorn/FastAPI create any event loop, so it is set at
# module import time (uvicorn imports app.main before it starts the loop).
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

logger.info(f"Event loop policy: {type(asyncio.get_event_loop_policy()).__name__}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .api.routes_health import router as health_router
from .api.routes_jobs import router as jobs_router

app = FastAPI(
    title="OpenShort Video Clipper Engine Service",
    description="Python FastAPI backend orchestrating speech diarization, viral hook extraction, and kinetic reframing.",
    version="0.4.2"
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register sub-routers
app.include_router(health_router)
app.include_router(jobs_router)

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_running_loop()
    loop_name = type(loop).__name__
    logger.info(f"Running event loop: {loop_name}")
    if sys.platform == "win32" and "Proactor" not in loop_name:
        logger.warning(
            "WARNING: running on a non-Proactor event loop (%s). "
            "asyncio.create_subprocess_exec will raise NotImplementedError on "
            "Windows, so the OpenShorts subprocess will fail. Start the service "
            "with: uvicorn app.main:app --host 0.0.0.0 --port 8001 --loop asyncio",
            loop_name,
        )
    logger.info(f"OpenShort Processing Engine Service booted on {settings.HOST}:{settings.PORT}")
    logger.info(f"Storage root initialized at {settings.STORAGE_ROOT}")

if __name__ == "__main__":
    import uvicorn
    # reload is disabled: on Windows `--reload` makes uvicorn use the
    # SelectorEventLoop (use_subprocess=True -> asyncio_loop_factory returns
    # SelectorEventLoop), which cannot launch subprocesses. Force the asyncio
    # loop explicitly (ProactorEventLoop is chosen on Windows by the policy set
    # above, and uvicorn's asyncio_loop_factory returns ProactorEventLoop when
    # use_subprocess=False).
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        loop="asyncio",
        reload=False,
    )
