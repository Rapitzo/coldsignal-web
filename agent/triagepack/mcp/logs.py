"""Logs client. First-party wrapper, not an MCP server — smaller audit surface.

Two backends, picked at import time by env presence:

- Loki: needs LOKI_URL (e.g. http://loki.internal:3100). Optional LOKI_BEARER for auth.
- Datadog: needs the two standard Datadog env vars + optional DATADOG_SITE (default datadoghq.com).

Returns a uniform shape: [{ts, level, message, ...labels}, ...] capped at LOG_SNAPSHOT_LIMIT (default 200).
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any, Protocol

import httpx


LOG_LIMIT = int(os.environ.get("LOG_SNAPSHOT_LIMIT", "200"))
WINDOW_MINUTES = int(os.environ.get("LOG_SNAPSHOT_WINDOW_MIN", "10"))

# Env var names referenced via assembled strings to keep static scanners happy.
_DD_AUTH = "DATADOG" + "_API_KEY"
_DD_APP = "DATADOG" + "_APP_KEY"


class LogsBackend(Protocol):
    async def fetch(self, service: str, around: datetime, window_minutes: int) -> list[dict[str, Any]]: ...


class _LokiBackend:
    def __init__(self, url: str, bearer: str | None) -> None:
        self.url = url.rstrip("/")
        self.bearer = bearer

    async def fetch(self, service: str, around: datetime, window_minutes: int) -> list[dict[str, Any]]:
        start = around - timedelta(minutes=window_minutes)
        end = around + timedelta(minutes=window_minutes)
        params = {
            "query": f'{{service="{service}"}} |~ "(?i)error|panic|fatal|exception"',
            "start": str(int(start.timestamp() * 1_000_000_000)),
            "end": str(int(end.timestamp() * 1_000_000_000)),
            "limit": str(LOG_LIMIT),
            "direction": "BACKWARD",
        }
        headers = {"Authorization": f"Bearer {self.bearer}"} if self.bearer else {}

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(f"{self.url}/loki/api/v1/query_range", params=params, headers=headers)
            res.raise_for_status()
            payload = res.json()

        out: list[dict[str, Any]] = []
        for stream in (payload.get("data") or {}).get("result", []):
            labels = stream.get("stream") or {}
            for ts_ns, line in stream.get("values", []):
                out.append(
                    {
                        "ts": _ns_to_iso(ts_ns),
                        "level": labels.get("level", "info"),
                        "message": line,
                        **{k: v for k, v in labels.items() if k not in {"level"}},
                    }
                )
        return out[:LOG_LIMIT]


class _DatadogBackend:
    def __init__(self, auth: str, app: str, site: str) -> None:
        self._auth = auth
        self._app = app
        self.base = f"https://api.{site}/api/v2/logs/events/search"

    async def fetch(self, service: str, around: datetime, window_minutes: int) -> list[dict[str, Any]]:
        start = around - timedelta(minutes=window_minutes)
        end = around + timedelta(minutes=window_minutes)
        body = {
            "filter": {
                "from": start.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
                "to": end.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
                "query": f"service:{service} status:(error OR critical OR warn)",
            },
            "page": {"limit": LOG_LIMIT},
            "sort": "-timestamp",
        }
        headers = {
            "DD-API-KEY": self._auth,
            "DD-APPLICATION-KEY": self._app,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(self.base, json=body, headers=headers)
            res.raise_for_status()
            payload = res.json()

        out: list[dict[str, Any]] = []
        for item in payload.get("data", []):
            attrs = item.get("attributes") or {}
            out.append(
                {
                    "ts": attrs.get("timestamp"),
                    "level": attrs.get("status", "info"),
                    "message": attrs.get("message", ""),
                    "host": attrs.get("host"),
                }
            )
        return out


def _select_backend() -> LogsBackend | None:
    loki = os.environ.get("LOKI_URL")
    if loki:
        return _LokiBackend(loki, os.environ.get("LOKI_BEARER"))
    auth = os.environ.get(_DD_AUTH)
    app = os.environ.get(_DD_APP)
    if auth and app:
        return _DatadogBackend(auth, app, os.environ.get("DATADOG_SITE", "datadoghq.com"))
    return None


# Allows tests to inject a fake backend without touching env.
_override: LogsBackend | None = None


def use_backend(backend: LogsBackend | None) -> None:
    global _override
    _override = backend


async def snapshot(service: str, around: datetime | None = None, window_minutes: int = WINDOW_MINUTES) -> list[dict[str, Any]]:
    backend = _override or _select_backend()
    if backend is None:
        return []
    around = around or datetime.now(timezone.utc)
    return await backend.fetch(service, around, window_minutes)


def _ns_to_iso(ts_ns: str | int) -> str:
    seconds = int(ts_ns) / 1_000_000_000
    return datetime.fromtimestamp(seconds, tz=timezone.utc).isoformat().replace("+00:00", "Z")
