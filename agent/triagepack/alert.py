"""Internal Alert type and adapters from PagerDuty / Datadog / Opsgenie payloads."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

Severity = Literal["sev1", "sev2", "sev3", "sev4", "info"]


class Alert(BaseModel):
    """Source-agnostic alert the rest of the agent reasons over."""

    source: Literal["pagerduty", "datadog", "opsgenie"]
    external_id: str
    title: str
    summary: str
    severity: Severity
    service: str
    repo: str | None = None
    received_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    raw: dict[str, Any] = Field(default_factory=dict)


def from_pagerduty(payload: dict[str, Any]) -> Alert:
    """Map a PagerDuty Webhook v3 payload into our Alert type.

    Reference: https://developer.pagerduty.com/docs/webhooks
    """
    event = payload.get("event") or {}
    data = event.get("data") or {}
    incident = data if data.get("type") == "incident" else (data.get("incident") or {})

    severity_map = {"critical": "sev1", "error": "sev2", "warning": "sev3", "info": "sev4"}
    sev = severity_map.get(str(incident.get("severity", "")).lower(), "sev3")

    service = (incident.get("service") or {}).get("summary") or "unknown-service"

    return Alert(
        source="pagerduty",
        external_id=str(incident.get("id") or event.get("id") or "unknown"),
        title=str(incident.get("title") or "Untitled incident"),
        summary=str(incident.get("description") or incident.get("title") or ""),
        severity=sev,  # type: ignore[arg-type]
        service=service,
        repo=None,  # resolved later by reasoning loop using a service→repo mapping
        raw=payload,
    )


# TODO Day 3: from_datadog, from_opsgenie
