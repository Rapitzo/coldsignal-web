"""GitHub recent-commits fetcher.

v0.1 implementation: thin first-party HTTPS client against the GitHub REST API.
Smaller audit surface than running the upstream `github-mcp-server` subprocess for
the only call we need. The wider MCP transport gets re-evaluated in v0.2 if the
reasoning loop grows past commits + a small handful of read-only calls.

Auth: fine-grained PAT scoped to the repos under triage. Read-only: contents.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx


GITHUB_API = "https://api.github.com"


class GitHubAuthError(RuntimeError):
    pass


def _auth_header() -> dict[str, str]:
    pat = os.environ.get("GITHUB_TOKEN")
    if not pat:
        raise GitHubAuthError("GITHUB_TOKEN not set")
    return {
        "Authorization": f"Bearer {pat}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


async def recent_commits(repo: str, since: datetime | None = None, limit: int = 20) -> list[dict[str, Any]]:
    """Recent commits to `repo` (`owner/name`) since `since` (default 60min ago).

    Returns the smallest projection the reasoning loop needs:
        [{sha, author, committed_at, message, url}, ...]
    """
    since = since or datetime.now(timezone.utc) - timedelta(minutes=60)
    if "/" not in repo:
        raise ValueError(f"repo must be 'owner/name', got: {repo!r}")

    params = {"since": since.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"), "per_page": str(limit)}
    url = f"{GITHUB_API}/repos/{repo}/commits"

    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(url, headers=_auth_header(), params=params)
        res.raise_for_status()
        raw = res.json()

    out: list[dict[str, Any]] = []
    for item in raw[:limit]:
        commit = item.get("commit") or {}
        author = (commit.get("author") or {}).get("name") or "unknown"
        out.append(
            {
                "sha": item.get("sha", "")[:12],
                "author": author,
                "committed_at": (commit.get("author") or {}).get("date"),
                "message": (commit.get("message") or "").splitlines()[0][:200],
                "url": item.get("html_url"),
            }
        )
    return out
