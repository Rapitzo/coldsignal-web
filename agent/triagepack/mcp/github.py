"""Pinned wrapper around the official GitHub MCP server.

Pinned: github-mcp-server v0.4.2 (audited 2026-04-27 against the April 2026 RCE class).
See ../../SECURITY.md for the audit checklist outcome.

This module deliberately exposes a small surface — only what the reasoning loop needs —
so the audit blast radius stays contained.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

# TODO Day 2: real MCP client wiring. Stub returns the call site's expected shape so
# downstream code can be written and typechecked first.


async def recent_commits(repo: str, since: datetime | None = None, limit: int = 20) -> list[dict[str, Any]]:
    """Recent commits to `repo`, default last 60 minutes, capped at `limit`."""
    since = since or datetime.now(timezone.utc) - timedelta(minutes=60)
    _ = (repo, since, limit)
    return []  # TODO Day 2
