"""Per-user transcription usage records, persisted in SQLite.

One record per job that reached actual processing (completed or failed after
the engine started), capturing what the free-tier daily limit and future
billing metering need: who, which job, which transcript provider, and how much
audio was processed.

PERSISTENCE: the records live in the shared SQLite file
``<STORAGE_ROOT>/app.db`` (table ``usage_records``) — the same file the Next.js
backend uses for jobs/clips/transcript_cache, so daily-limit enforcement
survives service restarts (the previous in-memory store did not). WAL mode
allows both processes to share the file safely on one host. No limit-
enforcement or billing logic beyond the free-tier daily count lives here yet.
"""
import sqlite3
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel, Field

from ..config import settings


class UsageRecord(BaseModel):
    userId: str
    jobId: str
    provider: str
    durationSeconds: Optional[float] = None
    # Epoch seconds for cheap window math, plus a human-readable ISO timestamp.
    timestamp: float = Field(default_factory=time.time)
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


def _start_of_today_local() -> float:
    now = datetime.now()
    return datetime(now.year, now.month, now.day).timestamp()


def default_db_path() -> str:
    root = Path(settings.STORAGE_ROOT or "storage")
    if not root.is_absolute():
        root = Path.cwd() / root
    return str((root / "app.db").resolve())


class UsageService:
    def __init__(self, db_path: Optional[str] = None):
        self._db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None
        self._lock = threading.Lock()

    def _db(self) -> sqlite3.Connection:
        if self._conn is None:
            path = self._db_path or default_db_path()
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            conn = sqlite3.connect(path, timeout=10.0)
            conn.execute("PRAGMA journal_mode=WAL")
            conn.execute("PRAGMA busy_timeout=5000")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS usage_records (
                    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id                TEXT NOT NULL,
                    job_id                 TEXT NOT NULL,
                    provider               TEXT NOT NULL,
                    video_duration_seconds REAL,
                    timestamp              REAL NOT NULL,
                    created_at             TEXT NOT NULL
                )
            """)
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_usage_user_ts "
                "ON usage_records(user_id, timestamp)")
            conn.commit()
            self._conn = conn
        return self._conn

    def record(
        self,
        user_id: str,
        job_id: str,
        provider: str,
        duration_seconds: Optional[float] = None,
    ) -> UsageRecord:
        record = UsageRecord(
            userId=user_id,
            jobId=job_id,
            provider=provider,
            durationSeconds=duration_seconds,
        )
        with self._lock:
            self._db().execute(
                "INSERT INTO usage_records "
                "(user_id, job_id, provider, video_duration_seconds, timestamp, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (record.userId, record.jobId, record.provider,
                 record.durationSeconds, record.timestamp, record.createdAt),
            )
            self._db().commit()
        return record

    def count_since(self, user_id: str, since_epoch: float) -> int:
        with self._lock:
            row = self._db().execute(
                "SELECT COUNT(*) FROM usage_records WHERE user_id = ? AND timestamp >= ?",
                (user_id, since_epoch),
            ).fetchone()
        return int(row[0]) if row else 0

    def count_today(self, user_id: str) -> int:
        return self.count_since(user_id, _start_of_today_local())

    def records_for(self, user_id: str) -> List[UsageRecord]:
        with self._lock:
            rows = self._db().execute(
                "SELECT user_id, job_id, provider, video_duration_seconds, "
                "timestamp, created_at FROM usage_records WHERE user_id = ? "
                "ORDER BY timestamp",
                (user_id,),
            ).fetchall()
        return [
            UsageRecord(
                userId=r[0], jobId=r[1], provider=r[2],
                durationSeconds=r[3], timestamp=r[4], createdAt=r[5],
            )
            for r in rows
        ]

    def clear(self) -> None:
        with self._lock:
            self._db().execute("DELETE FROM usage_records")
            self._db().commit()


default_usage_service = UsageService()
