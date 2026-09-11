"""Minimal user/tier lookup stub — PLACEHOLDER until real auth/billing lands.

There is NO authentication in the stack yet (the Next.js jobs router still
carries the "TODO: ownership check once auth is added" note). Until then the
requesting user is identified by an anonymous id that the Next.js layer
assigns per browser (``anon_uid`` cookie) or passes as an explicit test hook
(``x-user-id`` header), and the tier is resolved here from an explicit seed
list so paid users can be simulated locally:

  - ``PAID_USER_IDS`` (env): comma-separated user ids treated as "paid".
  - every other id — and the ``"anonymous"`` default — is "free".

Provider selection is tier-driven: free -> faster-whisper (self-hosted, zero
marginal cost), paid -> Deepgram (fast, per-minute cost). The
``TRANSCRIPT_PROVIDER`` env var remains a global override for testing/debugging:
when explicitly set it wins over the tier logic.

This module MUST be replaced by a real account/billing tier lookup when Phase 8
auth is built.
"""
import os
import threading
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from ..config import settings

ANONYMOUS_USER_ID = "anonymous"


class UserTier(str, Enum):
    FREE = "free"
    PAID = "paid"


class UserRecord(BaseModel):
    id: str
    tier: UserTier
    createdAt: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TierService:
    """In-memory user registry keyed by the anonymous id (stub, see module doc)."""

    def __init__(self, paid_user_ids: Optional[List[str]] = None):
        self._paid_ids = {uid.strip() for uid in (paid_user_ids or []) if uid.strip()}
        self._users: Dict[str, UserRecord] = {}
        self._lock = threading.Lock()

    def get_or_create(self, user_id: Optional[str] = None) -> UserRecord:
        uid = (user_id or "").strip() or ANONYMOUS_USER_ID
        with self._lock:
            user = self._users.get(uid)
            if user is None:
                tier = UserTier.PAID if uid in self._paid_ids else UserTier.FREE
                user = UserRecord(id=uid, tier=tier)
                self._users[uid] = user
        return user

    def select_provider(self, user: UserRecord) -> str:
        """Provider for this user's next job: tier-driven, env-overridable."""
        override = (os.environ.get("TRANSCRIPT_PROVIDER") or "").strip().lower()
        if override:
            return override
        if user.tier == UserTier.PAID:
            return "deepgram"
        return "faster_whisper"

    def max_duration_seconds(self, user: UserRecord) -> int:
        if user.tier == UserTier.PAID:
            return settings.PAID_TIER_MAX_DURATION_SECONDS
        return settings.FREE_TIER_MAX_DURATION_SECONDS


def _seed_paid_ids(raw: Optional[str]) -> List[str]:
    return [part.strip() for part in (raw or "").split(",") if part.strip()]


default_tier_service = TierService(paid_user_ids=_seed_paid_ids(settings.PAID_USER_IDS))
