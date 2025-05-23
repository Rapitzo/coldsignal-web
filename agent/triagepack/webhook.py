"""FastAPI receiver. Single endpoint per source so signature verification stays simple."""

from __future__ import annotations

from typing import Any

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request

from .alert import Alert, from_pagerduty
from .observability import setup_otel, tracer

setup_otel()

app = FastAPI(title="triagepack", version="0.1.0-dev")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/incidents")
async def pagerduty_incident(
    request: Request,
    background: BackgroundTasks,
    x_pagerduty_signature: str | None = Header(default=None),
) -> dict[str, str]:
    raw = await request.body()
    # TODO Day 6: verify HMAC signature against PAGERDUTY_WEBHOOK_SECRET
    # TODO Day 6: rate-limit per source IP
    payload: dict[str, Any] = await request.json()
    try:
        alert = from_pagerduty(payload)
    except Exception as exc:  # pragma: no cover — adapter is intentionally lenient
        raise HTTPException(status_code=400, detail=f"could not parse PagerDuty payload: {exc}")

    with tracer.start_as_current_span("triage.enqueue") as span:
        span.set_attribute("alert.source", alert.source)
        span.set_attribute("alert.severity", alert.severity)
        span.set_attribute("alert.service", alert.service)

    background.add_task(_run_triage, alert)
    return {"status": "accepted", "alert_id": alert.external_id}


async def _run_triage(alert: Alert) -> None:
    """Background entry point.

    Day 3: wires reasoning.triage(alert) → slack.post(...).
    For now the scaffold just records that we received the alert.
    """
    # TODO Day 3: from .reasoning import triage; result = await triage(alert)
    # TODO Day 3: from .slack import post_initial, update_thread
    return None
