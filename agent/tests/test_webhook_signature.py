"""HMAC verification gate for /v1/incidents."""

from __future__ import annotations

import hashlib
import hmac

from triagepack.webhook import _verify_pagerduty_signature


def _sign(body: bytes, shared: str) -> str:
    return "v1=" + hmac.new(shared.encode("utf-8"), body, hashlib.sha256).hexdigest()


def test_missing_env_rejects(monkeypatch):
    monkeypatch.delenv("PAGERDUTY_WEBHOOK_SECRET", raising=False)
    assert _verify_pagerduty_signature(b"{}", "v1=deadbeef") is False


def test_missing_header_rejects(monkeypatch):
    monkeypatch.setenv("PAGERDUTY_WEBHOOK_SECRET", "shh")
    assert _verify_pagerduty_signature(b"{}", None) is False


def test_valid_signature_accepts(monkeypatch):
    monkeypatch.setenv("PAGERDUTY_WEBHOOK_SECRET", "shh")
    body = b'{"event": "x"}'
    assert _verify_pagerduty_signature(body, _sign(body, "shh")) is True


def test_tampered_body_rejects(monkeypatch):
    monkeypatch.setenv("PAGERDUTY_WEBHOOK_SECRET", "shh")
    sig = _sign(b'{"event": "x"}', "shh")
    assert _verify_pagerduty_signature(b'{"event": "y"}', sig) is False


def test_wrong_secret_rejects(monkeypatch):
    monkeypatch.setenv("PAGERDUTY_WEBHOOK_SECRET", "shh")
    assert _verify_pagerduty_signature(b"{}", _sign(b"{}", "different")) is False


def test_rotation_accepts_either(monkeypatch):
    monkeypatch.setenv("PAGERDUTY_WEBHOOK_SECRET", "shh")
    body = b"{}"
    valid = _sign(body, "shh")
    bogus = "v1=" + ("0" * 64)
    # PagerDuty sends comma-separated v1 entries during rotation; either side good.
    assert _verify_pagerduty_signature(body, f"{bogus}, {valid}") is True
    assert _verify_pagerduty_signature(body, f"{valid}, {bogus}") is True


def test_malformed_header_rejects(monkeypatch):
    monkeypatch.setenv("PAGERDUTY_WEBHOOK_SECRET", "shh")
    assert _verify_pagerduty_signature(b"{}", "garbage") is False
    assert _verify_pagerduty_signature(b"{}", "v2=anything") is False
