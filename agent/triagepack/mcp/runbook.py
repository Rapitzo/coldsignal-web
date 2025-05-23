"""Runbook fetcher. Two backends: Notion (NOTION_TOKEN + NOTION_DATABASE_ID) or local markdown (RUNBOOK_DIR)."""

from __future__ import annotations

import os
from pathlib import Path

# TODO Day 3: real Notion client. For now the local-markdown path is real because it has zero deps.


async def fetch(service: str) -> str | None:
    """Return the raw markdown of the runbook keyed by `service`, or None if not found."""
    runbook_dir = os.environ.get("RUNBOOK_DIR")
    if runbook_dir:
        candidate = Path(runbook_dir) / f"{service}.md"
        if candidate.is_file():
            return candidate.read_text(encoding="utf-8")
        return None

    if os.environ.get("NOTION_TOKEN"):
        # TODO Day 3: Notion client lookup
        return None

    return None
