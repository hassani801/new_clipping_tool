import time

import pytest

from app.services.usage_service import UsageService


@pytest.fixture
def usage(tmp_path):
    return UsageService(db_path=str(tmp_path / "usage.db"))


def test_record_and_count_today(usage):
    usage.record("u1", "job1", "faster_whisper", 615.0)
    usage.record("u1", "job2", "deepgram", 1245.0)
    usage.record("u2", "job3", "deepgram", 100.0)

    assert usage.count_today("u1") == 2
    assert usage.count_today("u2") == 1
    assert usage.count_today("u3") == 0


def test_count_since_window(usage):
    now = time.time()
    usage.record("u1", "job1", "deepgram", 100.0)
    assert usage.count_since("u1", now + 1) == 0
    assert usage.count_since("u1", now - 60) == 1


def test_records_for_returns_copies(usage):
    usage.record("u1", "job1", "deepgram", 100.0)
    records = usage.records_for("u1")
    assert len(records) == 1
    assert records[0].jobId == "job1"
    assert records[0].provider == "deepgram"
    assert records[0].durationSeconds == 100.0
    records[0].jobId = "mutated"
    assert usage.records_for("u1")[0].jobId == "job1"


def test_clear(usage):
    usage.record("u1", "job1", "deepgram", 100.0)
    usage.clear()
    assert usage.count_today("u1") == 0


def test_records_survive_reconnect(tmp_path):
    """A new UsageService on the same db file sees previous records
    (this is what makes daily-limit enforcement survive restarts)."""
    path = str(tmp_path / "usage.db")
    first = UsageService(db_path=path)
    first.record("u1", "job1", "deepgram", 100.0)

    second = UsageService(db_path=path)
    assert second.count_today("u1") == 1
    assert second.records_for("u1")[0].jobId == "job1"
