# AI Video Clipping Platform (Cliptor SaaS)

An end-to-end AI-powered video clipping and repurposing platform. Ingests long-form video content (YouTube URLs or direct uploads), performs speech transcription, uses Gemini multimodal AI to detect high-retention golden moments, executes smart 9:16 computer-vision speaker reframing with face tracking, burns kinetic animated karaoke subtitles, and exports short-form clips ready for TikTok, Instagram Reels, and YouTube Shorts.

## Architecture

```
┌────────────────────────────────────────────────────────┐
│               Frontend: Next.js App Router            │
│       Port 3000 — Tailwind CSS, Framer Motion, UI      │
└───────────────────────────┬────────────────────────────┘
                            │ /api/* proxy rewrite
                            ▼
┌────────────────────────────────────────────────────────┐
│               Backend: NestJS API Gateway              │
│  Port 3001 — Auth (JWT/httpOnly), SQLite (TypeORM),     │
│       Jobs Orchestration, Campaigns, Tier Guards       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP POST /jobs (JSON)
                            ▼
┌────────────────────────────────────────────────────────┐
│            python-service: FastAPI Dispatcher          │
│   Port 8001 — Job queue, pre-download probe,           │
│         callback handler, storage management           │
└───────────────────────────┬────────────────────────────┘
                            │ Subprocess spawn (main.py)
                            ▼
┌────────────────────────────────────────────────────────┐
│               engine: OpenShorts Pipeline              │
│   yt-dlp → faster-whisper / Deepgram → Gemini AI       │
│   → YOLOv8 face tracking → ffmpeg ASS karaoke subtitle │
└────────────────────────────────────────────────────────┘
```

## Services Overview

| Service | Technology | Port | Directory | Description |
|---|---|---|---|---|
| **Frontend** | Next.js 16, React, TypeScript | `3000` | `frontend/` | Creator web app, dashboard, live progress viewer, campaign directory |
| **Backend** | NestJS 12, TypeORM, better-sqlite3 | `3001` | `backend/` | Central API gateway, authentication, job lifecycle, rate limiting |
| **Python Service** | FastAPI, Uvicorn, Python 3.10+ | `8001` | `python-service/` | Job scheduling queue and background processing coordinator |
| **Engine** | Python, OpenCV, YOLO, ffmpeg, Gemini | - | `engine/` | Media processing pipeline (download, transcribe, score, reframe, burn) |

---

## Environment Setup

All four services use `.env.example` files documenting their respective required and optional configuration keys:

1. **Root & Engine**: `engine/.env.example`
   - Configures `GEMINI_API_KEY`, `GEMINI_MODEL`, `TRANSCRIPT_PROVIDER` (`faster_whisper` or `deepgram`), `WHISPER_MODEL`, `FFMPEG_ENCODER`, YOLO, and scene detection parameters.
2. **Python Service**: `python-service/.env.example`
   - Configures `PORT` (`8001`), `BACKEND_INTERNAL_URL` (`http://127.0.0.1:3001`), `PYTHON_ENGINE_SECRET`, `FREE_TIER_DAILY_JOB_CAP`, `FREE_TIER_MAX_DURATION_SECONDS`, `PAID_TIER_MAX_DURATION_SECONDS`, and storage roots.
3. **Backend**: `backend/.env.example`
   - Configures `PORT` (`3001`), `DATABASE_PATH` (`db.sqlite`), `JWT_SECRET`, `CORS_ORIGIN`, `PYTHON_SERVICE_URL`, and `PYTHON_ENGINE_SECRET`.
4. **Frontend**: `frontend/.env.example`
   - Configures `BACKEND_URL` (`http://127.0.0.1:3001`) used by Next.js rewrites to proxy `/api/*` requests to the NestJS backend.

To configure local development:

```bash
# Backend
cp backend/.env.example backend/.env

# Python Service
cp python-service/.env.example python-service/.env

# Engine
cp engine/.env.example engine/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

---

## Running Locally

### 1. Backend (NestJS)

```bash
cd backend
npm install
npm run build
npm run start:dev
# → Running on http://127.0.0.1:3001 (Health check: http://127.0.0.1:3001/health)
```

### 2. Python Service & Engine

```bash
cd python-service
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
pip install -r ../engine/requirements.txt

# Windows: the --loop asyncio flag is required (see python-service/README.md)
uvicorn app.main:app --host 0.0.0.0 --port 8001 --loop asyncio
# → Running on http://127.0.0.1:8001
```

Or using Docker Compose:

```bash
cd python-service
docker-compose up -d --build
```

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:3000
```

---

## Core Features

- **Automated Moment Detection**: Uses Google Gemini (model configurable via `GEMINI_MODEL`) to analyze transcripts and identify engaging hooks, emotional peaks, and concise takeaways.
- **Smart 9:16 Reframe**: Uses YOLOv8 face detection to dynamically center and crop active speakers for vertical video.
- **Animated Karaoke Subtitles**: Frame-accurate word-level ASS kinetic subtitle burn-in.
- **Tier Limits & Usage Enforcement**: Free vs Pro limits enforced on duration, clip count, and daily quotas.
- **Campaign Listings & Submissions**: Creators can browse monetization campaigns and log submissions.
- **Protected Routing**: Next.js proxy route protection (`proxy.ts`) redirecting unauthenticated users to `/login`.
