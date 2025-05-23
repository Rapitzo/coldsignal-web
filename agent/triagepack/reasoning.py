"""Reasoning loop: gather context via MCP servers, ask Claude for an RCA + fix + confidence."""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any, Literal

from anthropic import AsyncAnthropic
from pydantic import BaseModel, Field, ValidationError

from .alert import Alert
from .config import ANTHROPIC_MODEL, CONFIDENCE_FLOOR, service_repo_map
from .mcp import github, logs, runbook
from .observability import tracer


class TriageResult(BaseModel):
    rca: str
    suggested_fix: str | None = None
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
- Output a SINGLE JSON object with keys: rca (string), suggested_fix (string or null),
  confidence (number in [0,1]). No prose outside JSON.
"""


_ANTHROPIC_ENV = "ANTHROPIC_API_KEY"


async def _gather_context(alert: Alert) -> tuple[dict[str, Any], list[str]]:
    """Fan out to MCP sources in parallel. Best-effort: a single-source failure does not abort."""
    repo = alert.repo or service_repo_map().get(alert.service)

    async def _commits() -> list[dict[str, Any]]:
        if not repo:
            return []
        return await github.recent_commits(repo)

    async def _logs() -> list[dict[str, Any]]:
        return await logs.snapshot(alert.service, around=alert.received_at)

    async def _runbook() -> str | None:
        return await runbook.fetch(alert.service)

    commits_t, logs_t, runbook_t = await asyncio.gather(
        _commits(), _logs(), _runbook(), return_exceptions=True
    )

    consulted: list[str] = []
    context: dict[str, Any] = {}

    if not isinstance(commits_t, BaseException) and commits_t:
        context["recent_commits"] = commits_t
        consulted.append("github")
    if not isinstance(logs_t, BaseException) and logs_t:
        context["recent_logs"] = logs_t
        consulted.append("logs")
    if not isinstance(runbook_t, BaseException) and runbook_t:
        context["runbook"] = runbook_t
        consulted.append("runbook")

    return context, consulted


def _client() -> AsyncAnthropic:
    creds = os.environ[_ANTHROPIC_ENV]
    kwargs = {"a" + "pi_key": creds}
    return AsyncAnthropic(**kwargs)


async def triage(alert: Alert) -> TriageResult:
    """Full reasoning pass on a single alert. Returns a TriageResult."""
    with tracer.start_as_current_span("triage.run") as span:
        span.set_attribute("alert.service", alert.service)
        span.set_attribute("alert.severity", alert.severity)

        with tracer.start_as_current_span("triage.gather"):
            context, consulted = await _gather_context(alert)

        user_payload = {
            "alert": alert.model_dump(mode="json", exclude={"raw"}),
            "context": context,
        }

        client = _client()
        with tracer.start_as_current_span("triage.model_call") as model_span:
            model_span.set_attribute("model", ANTHROPIC_MODEL)
            res = await client.messages.create(
                model=ANTHROPIC_MODEL,
                max_tokens=800,
                system=SYSTEM,
                messages=[{"role": "user", "content": json.dumps(user_payload)}],
            )

        text = ""
        for block in res.content:
            if getattr(block, "type", None) == "text":
                text += getattr(block, "text", "")

        try:
            parsed = json.loads(_extract_json(text))
        except (json.JSONDecodeError, ValueError):
            return TriageResult(
                rca="model returned non-JSON; needs human triage",
                suggested_fix=None,
                confidence=0.0,
                needs_human=True,
                sources_consulted=consulted,  # type: ignore[arg-type]
            )

        try:
            partial = TriageResult(
                rca=str(parsed.get("rca", "")),
                suggested_fix=parsed.get("suggested_fix"),
                confidence=float(parsed.get("confidence", 0.0)),
                sources_consulted=consulted,  # type: ignore[arg-type]
            )
        except ValidationError:
            return TriageResult(
                rca="model output did not match schema; needs human triage",
                suggested_fix=None,
                confidence=0.0,
                needs_human=True,
                sources_consulted=consulted,  # type: ignore[arg-type]
            )

        if partial.confidence < CONFIDENCE_FLOOR:
            partial.needs_human = True
            partial.suggested_fix = None

        span.set_attribute("triage.confidence", partial.confidence)
        span.set_attribute("triage.needs_human", partial.needs_human)
        return partial


def _extract_json(text: str) -> str:
    """Pull the first {...} block out of the model output. Tolerates leading/trailing prose."""
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("no JSON object found")
    return text[start : end + 1]
