"""FastAPI receiver. Single endpoint per source so signature verification stays simple."""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request

from .alert import Alert, from_pagerduty
from .observability import setup_otel, tracer
from .reasoning import triage
from . import slack

setup_otel()
log = logging.getLogger("triagepack.webhook")

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
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"could not parse PagerDuty payload: {exc}")

    with tracer.start_as_current_span("triage.enqueue") as span:
        span.set_attribute("alert.source", alert.source)
        span.set_attribute("alert.severity", alert.severity)
        span.set_attribute("alert.service", alert.service)

    background.add_task(_run_triage, alert)
    return {"status": "accepted", "alert_id": alert.external_id}


async def _run_triage(alert: Alert) -> None:
    """Pipe a single alert through the reasoning loop and post results to Slack."""
    slack_enabled = bool(os.environ.get("SLACK_BOT_TOKEN") and os.environ.get("SLACK_CHANNEL_ID"))

    thread_ts: str | None = None
    if slack_enabled:
        try:
            thread_ts = await slack.post_initial(alert)
        except Exception:
            log.exception("slack.post_initial failed; continuing without thread")

    try:
        result = await triage(alert)
    except Exception:
        log.exception("triage() raised; alert %s left untriaged", alert.external_id)
        return

    if slack_enabled and thread_ts:
        try:
            await slack.update_thread(thread_ts, alert, result)
        except Exception:
            log.exception("slack.update_thread failed for alert %s", alert.external_id)
    else:
        log.info(
            "triaged %s confidence=%.2f needs_human=%s",
            alert.external_id,
            result.confidence,
            result.needs_human,
        )
