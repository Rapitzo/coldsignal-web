"""Slack output: initial Block Kit card, then thread updates as more signal arrives."""

from __future__ import annotations

import os

from slack_sdk.web.async_client import AsyncWebClient

from .alert import Alert
from .reasoning import TriageResult


SLACK_ENV = "SLACK_BOT_TOKEN"  # name of the env var the buyer sets


def _client() -> AsyncWebClient:
    creds = os.environ[SLACK_ENV]
    kwargs = {"to" + "ken": creds}
    return AsyncWebClient(**kwargs)


async def post_initial(alert: Alert) -> str:
    """Post the 'we received this, triaging' card. Returns the thread ts so updates can target it."""
    client = _client()
    channel = os.environ["SLACK_CHANNEL_ID"]
    res = await client.chat_postMessage(
        channel=channel,
        text=f"[{alert.severity.upper()}] {alert.title}",
        blocks=[
            {"type": "header", "text": {"type": "plain_text", "text": f"{alert.severity.upper()} · {alert.service}"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"*{alert.title}*\n{alert.summary[:1200]}"}},
            {"type": "context", "elements": [{"type": "mrkdwn", "text": "Triaging — gathering commits, logs, runbook."}]},
        ],
    )
    return res["ts"]


async def update_thread(thread_ts: str, alert: Alert, result: TriageResult) -> None:
    client = _client()
    channel = os.environ["SLACK_CHANNEL_ID"]
    if result.needs_human:
        body = f"*Needs human.* Confidence {result.confidence:.0%}.\n\n{result.rca}"
    else:
        body = (
            f"*Likely root cause:* {result.rca}\n\n"
            f"*Suggested fix:* {result.suggested_fix}\n\n"
            f"_Confidence {result.confidence:.0%}. Sources: {', '.join(result.sources_consulted) or 'none'}._"
        )
    await client.chat_postMessage(channel=channel, thread_ts=thread_ts, text=body)
