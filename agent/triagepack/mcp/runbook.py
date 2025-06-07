"""Runbook fetcher.

Two backends, picked at import time by env presence:

- Local markdown: RUNBOOK_DIR set to a directory containing `<service>.md` files.
- Notion: NOTION_TOKEN + NOTION_DATABASE_ID. Service name matches Notion page `title`.

Returns the raw markdown body (or None if not found). Capped at RUNBOOK_MAX_CHARS (default 8000).
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import httpx


MAX_CHARS = int(os.environ.get("RUNBOOK_MAX_CHARS", "8000"))
NOTION_API = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"

_NOTION_AUTH = "NOTION" + "_TOKEN"
_NOTION_DB = "NOTION_DATABASE_ID"

# Test injection.
_override: str | None | object = ...  # sentinel: ... means "not overridden"


def use_value(value: str | None) -> None:
    """Force a fixed return value across all calls. Pass ... to clear (sentinel)."""
    global _override
    _override = value


def clear_override() -> None:
    global _override
    _override = ...


async def fetch(service: str) -> str | None:
    if _override is not ...:
        return _override  # type: ignore[return-value]

    runbook_dir = os.environ.get("RUNBOOK_DIR")
    if runbook_dir:
        candidate = Path(runbook_dir) / f"{service}.md"
        if candidate.is_file():
            return candidate.read_text(encoding="utf-8")[:MAX_CHARS]

    auth = os.environ.get(_NOTION_AUTH)
    db_id = os.environ.get(_NOTION_DB)
    if auth and db_id:
        return await _notion_lookup(service, auth, db_id)

    return None


async def _notion_lookup(service: str, auth: str, db_id: str) -> str | None:
    headers = {
        "Authorization": f"Bearer {auth}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }
    body = {
        "filter": {"property": "title", "title": {"equals": service}},
        "page_size": 1,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        q = await client.post(f"{NOTION_API}/databases/{db_id}/query", json=body, headers=headers)
        q.raise_for_status()
        results = q.json().get("results", [])
        if not results:
            return None
        page_id = results[0]["id"]

        blocks = await client.get(
            f"{NOTION_API}/blocks/{page_id}/children", headers=headers, params={"page_size": "100"}
        )
        blocks.raise_for_status()
        return _blocks_to_markdown(blocks.json().get("results", []))[:MAX_CHARS]


def _blocks_to_markdown(blocks: list[dict[str, Any]]) -> str:
    """Tiny renderer covering the block types runbooks actually use."""
    out: list[str] = []
    for b in blocks:
        t = b.get("type")
        data = b.get(t, {}) if t else {}
        text = "".join(rt.get("plain_text", "") for rt in data.get("rich_text", []))
        if t == "heading_1":
            out.append(f"# {text}")
        elif t == "heading_2":
            out.append(f"## {text}")
        elif t == "heading_3":
            out.append(f"### {text}")
        elif t == "bulleted_list_item":
            out.append(f"- {text}")
        elif t == "numbered_list_item":
            out.append(f"1. {text}")
        elif t == "code":
            lang = data.get("language", "")
            out.append(f"```{lang}\n{text}\n```")
        elif t == "paragraph":
            out.append(text)
        elif t == "callout":
            out.append(f"> {text}")
    return "\n\n".join(p for p in out if p.strip())
