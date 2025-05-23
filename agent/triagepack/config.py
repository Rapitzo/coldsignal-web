"""Runtime config. Read once at process start; do not mutate after."""

from __future__ import annotations

import json
import os
from functools import lru_cache


@lru_cache(maxsize=1)
def service_repo_map() -> dict[str, str]:
    """Map service name (as it appears in PagerDuty) -> GitHub repo (`owner/name`).

    Provided either as JSON in `SERVICE_REPO_MAP` or a path to a JSON file in
    `SERVICE_REPO_MAP_PATH`. Returns {} if neither is set; the reasoning loop
    will then skip the GitHub fetch and lower its confidence accordingly.
    """
    raw = os.environ.get("SERVICE_REPO_MAP")
    path = os.environ.get("SERVICE_REPO_MAP_PATH")
    if path and not raw:
        try:
            with open(path, encoding="utf-8") as fh:
                raw = fh.read()
        except OSError:
            return {}
    if not raw:
        return {}
    try:
        loaded = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    if not isinstance(loaded, dict):
        return {}
    return {str(k): str(v) for k, v in loaded.items()}


CONFIDENCE_FLOOR = float(os.environ.get("CONFIDENCE_FLOOR", "0.6"))
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
