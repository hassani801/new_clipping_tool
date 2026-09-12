# OpenShorts Engine Service

Standalone FastAPI service that wraps the OpenShorts clipping engine behind a
clean HTTP API, so the Next.js app can call it over HTTP instead of sharing a
filesystem or spawning subprocesses.

```
Next.js app  --HTTP-->  this service  --subprocess-->  OpenShorts main.py
                            (FastAPI)                      (torch/whisper/mediapipe)
```

## API

| Method | Path | Description |
|---|---|---|
| `POST` | `/jobs` | Start a job. Body: `{jobId, videoId, inputPath?|inputUrl?, settings}`. Returns `202 {jobId, status}`. |
| `GET` | `/jobs/{id}` | Job status/stage/progress. |
| `GET` | `/jobs/{id}/result` | Final clip metadata (title, score, duration, hook, captions, `clipUrl`, `outputPath`). |
| `GET` | `/jobs/{id}/clips/{file}` | Serve a produced clip file (HTTP Range supported for seeking). |
| `DELETE` | `/jobs/{id}` | Cancel a queued/running job. |
| `GET` | `/health` | Liveness/readiness (ffmpeg, storage backend, Gemini key presence, disk). |

The service also POSTs a completion callback to
`BACKEND_INTERNAL_URL/api/internal/jobs/{id}/result`, so the NestJS backend
doesn't have to rely only on polling for results.

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `OPENSHORT_ROOT` | `../engine` (sibling) | Path to the headless video engine (`engine/`). |
| `OPENSHORT_PYTHON` | this interpreter | Interpreter that runs `main.py` (usually the same venv). |
| `GEMINI_API_KEY` | — | Passed to OpenShorts for moment detection. |
| `STORAGE_BACKEND` | `local` | `local` (shared disk) or `s3` (object storage). |
| `STORAGE_ROOT` | `../storage` | Root dir for jobs (local backend). |
| `STORAGE_BUCKET` / `S3_ENDPOINT_URL` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` / `S3_REGION` | — | Object storage (when `STORAGE_BACKEND=s3`). |
| `PUBLIC_BASE_URL` | — | Absolute base URL used to build `clipUrl` in results/callbacks. |
| `MAX_CONCURRENT_JOBS` | `1` | In-process concurrency bound. |
| `PORT` / `HOST` | `8001` / `0.0.0.0` | Bind address. |
| `BACKEND_INTERNAL_URL` | `http://127.0.0.1:3001` | NestJS backend callback target. |
| `PYTHON_ENGINE_SECRET` | `change-me-secret-token` | Shared secret with the NestJS backend. |
| `ENGINE_TYPE` | `openshort` | `openshort` (real) or `mock`. |
| `STAGE_NAME` | `local` | Deployment label in `/health`. |
| `TRANSCRIPT_PROVIDER` | tier-selected | Force one transcript provider for ALL users (debug override). Unset: free users get `faster_whisper`, paid users get `deepgram`. |
| `DEEPGRAM_API_KEY` | — | Required when the `deepgram` provider runs. |
| `PAID_USER_IDS` | — | Dev-only paid-tier seed list; ignored unless `DEV_ALLOW_PAID_USER_IDS=1`. |
| `FREE_TIER_DAILY_JOB_CAP` | `2` | Free tier: max jobs started per day (in-flight + completed today). |
| `FREE_TIER_MAX_DURATION_SECONDS` | `600` | Free tier max source duration, checked before processing. |
| `PAID_TIER_MAX_DURATION_SECONDS` | `1800` | Paid tier max source duration, checked before processing. |

## Run locally

```bash
cd python-service
cp .env.example .env          # fill in GEMINI_API_KEY, OPENSHORT_ROOT, OPENSHORT_PYTHON
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
# The engine itself needs its own deps (see engine/requirements.txt) in the
# interpreter named by OPENSHORT_PYTHON (Python 3.11).
uvicorn app.main:app --host 0.0.0.0 --port 8001 --loop asyncio
```

> **Windows — use the exact command above.** This service launches OpenShorts as
> an asyncio subprocess, which requires the `ProactorEventLoop` on Windows.
>
> - `--loop asyncio` (plus no `--reload`) reliably selects `ProactorEventLoop`
>   (verified at startup via the `Running event loop:` log line).
> - **Do NOT pass `--reload` or `--workers N` (N > 1).** Either flag sets
>   uvicorn's `use_subprocess=True`, which makes its loop factory return the
>   `SelectorEventLoop` regardless of the module-level
>   `WindowsProactorEventLoopPolicy` — `asyncio.create_subprocess_exec` then
>   raises `NotImplementedError`.
> - The service also prints a `WARNING` at startup if it detects a
>   non-Proactor event loop, so a wrong command is caught at boot, not mid-job.

## Run via Docker

Build context is the repo root (so the image can include the OpenShorts engine):

```bash
cd python-service
docker compose up --build
```

Or directly:

```bash
docker build -f python-service/Dockerfile -t python-service-openshort-engine:latest .
docker run --rm -p 8001:8001 \
  -e GEMINI_API_KEY=... -e PUBLIC_BASE_URL=http://localhost:8001 \
  -e BACKEND_INTERNAL_URL=http://host.docker.internal:3001 \
  python-service-openshort-engine:latest
```

## Storage approach (chosen)

- **`local` (default, implemented now):** the service reads/writes `STORAGE_ROOT`
  on its own disk and serves clips itself via `/jobs/{id}/clips/{file}`. This
  requires the service and (optionally) the Next.js app to share a filesystem
  only if the Next.js side uses the shared-disk `inputPath` — it is the simplest
  to stand up first.
- **`s3` (first pass, swappable):** the engine still writes locally, but on
  completion outputs are uploaded to an S3-compatible bucket and clips are
  returned as pre-signed URLs (`STORAGE_BACKEND=s3`). Input can be supplied via
  `inputUrl`. This is the recommended path for fully independent deployment
  (no shared disk at all); full bucket-based input (Next.js uploads to the
  bucket and passes an object key) is a follow-up.

The abstraction lives in `app/storage/` (`StorageBackend` + `local`/`s3`
backends + `get_storage_backend()` factory), so switching is an env change, not
a code change.
