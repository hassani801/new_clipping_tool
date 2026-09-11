# Minimal CPU image for the video clipping engine (CLI only).
# Build:  docker build -t video-engine ./engine
# Run:
#   docker run --rm -v "$PWD/in:/in" -v "$PWD/out:/out" \
#     -e GEMINI_API_KEY video-engine \
#     -i /in/video.mp4 -o /out --format 9:16

FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

# ffmpeg + OpenCV runtime libs + fonts for ASS caption burn-in / hook emoji
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    fontconfig \
    fonts-liberation \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

COPY . .

# Register bundled subtitle/hook fonts with fontconfig
RUN mkdir -p /usr/local/share/fonts/openshorts \
    && cp fonts/*.ttf /usr/local/share/fonts/openshorts/ \
    && cp fonts/openshorts-fontmap.conf /etc/fonts/conf.d/60-openshorts.conf \
    && fc-cache -f

RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser \
    && mkdir -p /app/uploads /app/output /app/.cache/huggingface /tmp/Ultralytics \
    && chown -R appuser:appuser /app /tmp/Ultralytics

USER appuser

ENV YOLO_MODEL_PATH=/app/yolov8n.pt

# Headless CLI — NestJS / python-service spawn: python main.py -i … -o …
ENTRYPOINT ["python", "main.py"]
CMD ["--help"]
