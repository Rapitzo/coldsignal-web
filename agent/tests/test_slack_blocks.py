"""Pure-function tests for Slack Block Kit shape. No network."""

from __future__ import annotations

from triagepack.alert import Alert
from triagepack.reasoning import TriageResult
from triagepack.slack import initial_blocks, result_blocks


def _alert() -> Alert:
    return Alert(
        source="pagerduty",
        external_id="PINC-X",
        title="checkout-api p99 > 5s",
        summary="synthetic check failing",
        severity="sev1",
        service="checkout-api",
    )


def test_initial_blocks_has_header_section_context() -> None:
    blocks = initial_blocks(_alert())
    assert [b["type"] for b in blocks] == ["header", "section", "context"]
    assert "SEV1" in blocks[0]["text"]["text"]
    assert "checkout-api" in blocks[0]["text"]["text"]


def test_result_blocks_high_confidence_includes_fix() -> None:
    result = TriageResult(
        rca="redis OOM after a new cache write path landed",
        suggested_fix="raise maxmemory or revert commit a1b2c3d4",
        confidence=0.82,
        sources_consulted=["github", "logs", "runbook"],
    )
    blocks = result_blocks(_alert(), result)
    text = blocks[0]["text"]["text"]
    assert "Likely root cause" in text
    assert "redis OOM" in text
    assert "raise maxmemory" in text
    # actions block last, with three buttons
    actions = blocks[-1]
    assert actions["type"] == "actions"
    assert len(actions["elements"]) == 3
    assert {e["action_id"] for e in actions["elements"]} == {
        "triagepack_ack",
        "triagepack_resolved",
        "triagepack_needs_human",
    }


def test_result_blocks_needs_human_omits_fix() -> None:
    result = TriageResult(
        rca="signal too thin to point at a root cause",
        suggested_fix=None,
        confidence=0.35,
        needs_human=True,
        sources_consulted=["logs"],
    )
    blocks = result_blocks(_alert(), result)
    text = blocks[0]["text"]["text"]
    assert "Needs human" in text
    assert "Suggested fix" not in text
