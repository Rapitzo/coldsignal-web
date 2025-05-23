"""Thin first-party logs client. Smaller audit surface than depending on a third-party MCP server.

Backends: Loki (LOKI_URL) and Datadog (DATADOG_API_KEY + DATADOG_APP_KEY). Choose one per install.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

# TODO Day 3: implement Loki + Datadog backends behind a Backend protocol.


async def snapshot(service: str, around: datetime | None = None, window_minutes: int = 10) -> list[dict[str, Any]]:
    """Fetch a window of logs around `around` for `service`. Capped at 500 lines."""
    around = around or datetime.now(timezone.utc)
    backend = "loki" if os.environ.get("LOKI_URL") else "datadog"
    _ = (service, around, window_minutes, backend)
    return []  # TODO Day 3
