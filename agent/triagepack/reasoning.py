"""Reasoning loop: gather context via MCP servers, ask Claude for an RCA + fix + confidence."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from .alert import Alert


class TriageResult(BaseModel):
    rca: str
    suggested_fix: str | None = None  # None when confidence < floor → "needs human"
    confidence: float = Field(ge=0.0, le=1.0)
    needs_human: bool = False
    sources_consulted: list[Literal["github", "logs", "runbook"]] = Field(default_factory=list)


SYSTEM = """\
You are an SRE on-call assistant. You receive an alert plus context gathered from \
the affected service's recent commits, fresh logs, and the linked runbook. Produce a \
likely root cause, a concrete suggested fix, and a calibrated confidence score in [0, 1].

Hard rules:
- Never propose a deploy, restart, traffic shift, or paging action. You suggest, humans act.
- If the evidence is thin or contradictory, set confidence below 0.6 and say what additional \
  signal would resolve the ambiguity.
- Cite which source (commit / log / runbook) supports each claim.
- Output JSON matching the TriageResult schema. No prose outside JSON.
"""


CONFIDENCE_FLOOR = 0.6


async def triage(alert: Alert) -> TriageResult:
    """Run the full reasoning loop. TODO Day 3: real implementation.

    Sketch:
        1. resolve service → repo via SERVICE_REPO_MAP
        2. parallel-fetch:
            - github.recent_commits(repo, since=alert.received_at - 1h)
            - logs.snapshot(service=alert.service, around=alert.received_at)
            - runbook.fetch(alert.service)
        3. Anthropic messages.create with SYSTEM + alert + gathered context, JSON-only output
        4. parse → TriageResult; clamp confidence; set needs_human if < CONFIDENCE_FLOOR
    """
    raise NotImplementedError("triage() lands Day 3 per LIN-4 plan")
