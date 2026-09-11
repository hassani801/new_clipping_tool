# FastAPI orchestrator + headless video engine — standalone container.
#
# Build context MUST be the workspace root (clipping_tool),
# so the Dockerfile can copy both engine/ and this service:
#   docker build -f python-service/Dockerfile -t python-service-openshort-engine .
#   (or use the provided docker-compose.yml which sets context: ..)

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# System deps: ffmpeg (OpenShorts hard-depends on it) + the GL/libgomp libs that
# OpenCV, torch and mediapipe need at runtime.
# Debian trixie: use libgl1 instead of deprecated libgl1-mesa-glx.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
# NOTE (GPU): this image is CPU-only. If NVENC/GPU acceleration is added later,
# switch the base image to a CUDA-enabled one (e.g. nvidia/cuda:12.x-runtime)
# and install the matching CUDA torch build instead of the CPU wheels below.
# ---------------------------------------------------------------------------

# Install CPU torch/torchvision first so the multi-GB CUDA default wheels from
# PyPI are not pulled on Linux.
RUN pip install torch==2.11.0 torchvision==0.26.0 --index-url https://download.pytorch.org/whl/cpu

# Headless video engine + its pinned requirements (torch/torchvision already
# satisfied above, so exclude them from this pass).
COPY engine/ /app/engine/
RUN grep -v -E '^(torch|torchvision)==' /app/engine/requirements.txt > /tmp/os-requirements.txt \
    && pip install -r /tmp/os-requirements.txt

# The FastAPI service itself.
COPY python-service/ /app/service/
RUN pip install -r /app/service/requirements.txt

WORKDIR /app/service

ENV OPENSHORT_ROOT=/app/engine \
    OPENSHORT_PYTHON=/usr/local/bin/python \
    STORAGE_ROOT=/data/storage \
    STORAGE_BACKEND=local \
    HOST=0.0.0.0 \
    PORT=8001

# Persistent storage for job workspaces/outputs (local backend).
VOLUME ["/data/storage"]

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
# uvicorn app.main:app --host 0.0.0.0 --port 8001 --loop asyncio