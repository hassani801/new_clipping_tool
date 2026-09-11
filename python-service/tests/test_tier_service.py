import pytest

from app.services.tier_service import (
    ANONYMOUS_USER_ID,
    TierService,
    UserRecord,
    UserTier,
)


def test_unknown_user_defaults_to_free():
    svc = TierService(paid_user_ids=[])
    user = svc.get_or_create("some_new_browser")
    assert user.id == "some_new_browser"
    assert user.tier == UserTier.FREE
    assert user.createdAt


def test_missing_id_falls_back_to_anonymous():
    svc = TierService(paid_user_ids=[])
    assert svc.get_or_create(None).id == ANONYMOUS_USER_ID
    assert svc.get_or_create("  ").id == ANONYMOUS_USER_ID


def test_paid_user_ids_seed_paid_tier():
    svc = TierService(paid_user_ids=["alice", " bob "])
    assert svc.get_or_create("alice").tier == UserTier.PAID
    assert svc.get_or_create("bob").tier == UserTier.PAID
    assert svc.get_or_create("carol").tier == UserTier.FREE


def test_same_id_returns_same_record():
    svc = TierService(paid_user_ids=[])
    assert svc.get_or_create("u1") is svc.get_or_create("u1")


def test_select_provider_by_tier(monkeypatch):
    monkeypatch.delenv("TRANSCRIPT_PROVIDER", raising=False)
    svc = TierService(paid_user_ids=["alice"])
    assert svc.select_provider(svc.get_or_create("alice")) == "deepgram"
    assert svc.select_provider(svc.get_or_create("bob")) == "faster_whisper"


def test_select_provider_env_override_wins(monkeypatch):
    monkeypatch.setenv("TRANSCRIPT_PROVIDER", "deepgram")
    svc = TierService(paid_user_ids=[])
    assert svc.select_provider(svc.get_or_create("bob")) == "deepgram"
    monkeypatch.setenv("TRANSCRIPT_PROVIDER", "faster_whisper")
    svc2 = TierService(paid_user_ids=["alice"])
    assert svc2.select_provider(svc2.get_or_create("alice")) == "faster_whisper"


def test_max_duration_seconds_by_tier(monkeypatch):
    monkeypatch.setattr(
        "app.services.tier_service.settings.FREE_TIER_MAX_VIDEO_SECONDS", 600)
    monkeypatch.setattr(
        "app.services.tier_service.settings.PAID_TIER_MAX_VIDEO_SECONDS", 1800)
    svc = TierService(paid_user_ids=["alice"])
    assert svc.max_duration_seconds(svc.get_or_create("alice")) == 1800
    assert svc.max_duration_seconds(svc.get_or_create("bob")) == 600
