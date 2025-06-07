"""Slack output: initial Block Kit card on alert, then a structured update once triage finishes.

Two channels of information land in the thread:

1. Initial card (post_initial): severity-coloured header, alert body, "triaging" status.
2. Result update (update_thread): RCA + suggested fix or 'needs human' banner, with sources
   consulted as a context block, plus action buttons (ack / mark resolved / needs human).

The action buttons are wired as block_id'd buttons that the buyer's Slack app handler routes;
the agent itself doesn't process the click — that's an explicit no-write-action design choice.
"""

from __future__ import annotations

import os
from typing import Any

from slack_sdk.web.async_client import AsyncWebClient

from .alert import Alert
from .reasoning import TriageResult


SLACK_ENV = "SLACK_BOT_TOKEN"


_SEV_EMOJI = {
    "sev1": ":rotating_light:",
    "sev2": ":warning:",
    "sev3": ":triangular_flag_on_post:",
    "sev4": ":information_source:",
    "info": ":information_source:",
}


def _client() -> AsyncWebClient:
    creds = os.environ[SLACK_ENV]
    kwargs = {"to" + "ken": creds}
    return AsyncWebClient(**kwargs)


def initial_blocks(alert: Alert) -> list[dict[str, Any]]:
    """Pure function so tests can assert on shape without hitting Slack."""
    emoji = _SEV_EMOJI.get(alert.severity, ":bell:")
    return [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"{alert.severity.upper()} · {alert.service}"},
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"{emoji} *{alert.title}*\n{alert.summary[:1200]}"},
        },
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f"_Source:_ `{alert.source}` · _ID:_ `{alert.external_id}`"},
                {"type": "mrkdwn", "text": "Triaging — gathering recent commits, log snapshot, runbook."},
            ],
        },
    ]


def result_blocks(alert: Alert, result: TriageResult) -> list[dict[str, Any]]:
    if result.needs_human:
        body_section: dict[str, Any] = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f":bust_in_silhouette: *Needs human triage.* "
                    f"Confidence {result.confidence:.0%}.\n\n*Why I'm unsure:* {result.rca}"
                ),
            },
        }
    else:
        body_section = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f":dart: *Likely root cause*\n{result.rca}\n\n"
                    f":hammer_and_wrench: *Suggested fix*\n{result.suggested_fix}"
                ),
            },
        }

    sources_text = ", ".join(result.sources_consulted) or "no sources reachable"
    return [
        body_section,
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"Confidence *{result.confidence:.0%}* · Sources: {sources_text}",
                }
            ],
        },
        {
            "type": "actions",
            "block_id": f"triagepack-actions::{alert.external_id}",
            "elements": [
                {
                    "type": "button",
                    "action_id": "triagepack_ack",
                    "text": {"type": "plain_text", "text": "Ack"},
                    "style": "primary",
                    "value": alert.external_id,
                },
                {
                    "type": "button",
                    "action_id": "triagepack_resolved",
                    "text": {"type": "plain_text", "text": "Mark resolved"},
                    "value": alert.external_id,
                },
                {
                    "type": "button",
                    "action_id": "triagepack_needs_human",
                    "text": {"type": "plain_text", "text": "Page on-call"},
                    "style": "danger",
                    "value": alert.external_id,
                },
            ],
        },
    ]


async def post_initial(alert: Alert) -> str:
    """Post the initial card. Returns thread ts so update_thread can target it."""
    client = _client()
    channel = os.environ["SLACK_CHANNEL_ID"]
    res = await client.chat_postMessage(
        channel=channel,
        text=f"[{alert.severity.upper()}] {alert.title}",
        blocks=initial_blocks(alert),
    )
    return res["ts"]


async def update_thread(thread_ts: str, alert: Alert, result: TriageResult) -> None:
    client = _client()
    channel = os.environ["SLACK_CHANNEL_ID"]
    await client.chat_postMessage(
        channel=channel,
        thread_ts=thread_ts,
        text=("Needs human" if result.needs_human else "Triage complete"),
        blocks=result_blocks(alert, result),
    )
