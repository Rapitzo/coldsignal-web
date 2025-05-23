"""Smoke tests for the alert adapters. No network, no model calls."""

from __future__ import annotations

import json
from pathlib import Path

from triagepack.alert import from_pagerduty


FIXTURES = Path(__file__).resolve().parents[1] / "evals" / "scenarios"


def test_canned_pagerduty_parses_to_alert() -> None:
    payload = json.loads((FIXTURES / "canned-pagerduty.json").read_text(encoding="utf-8"))
    alert = from_pagerduty(payload)

    assert alert.source == "pagerduty"
    assert alert.external_id == "PINC-CANNED-001"
    assert alert.severity == "sev1"
    assert alert.service == "checkout-api"
    assert "p99 latency" in alert.title
    assert alert.raw == payload  # raw payload retained for downstream verification
