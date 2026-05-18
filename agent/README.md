# Incident Triage Agent (working name: triagepack)

The actual product. Lives next to the marketing site (`../app/`) but ships as a separate signed artefact.

## What's here

```
agent/
├── README.md                # this file
├── pyproject.toml           # Python 3.12 package config (uv-compatible)
├── triagepack/
│   ├── __init__.py
│   ├── alert.py             # internal Alert type + adapters for PagerDuty/Datadog/Opsgenie
│   ├── webhook.py           # FastAPI receiver (POST /v1/incidents)
│   ├── reasoning.py         # Claude call: gather context → propose RCA + fix + confidence
│   ├── slack.py             # Block Kit poster + thread updater
│   ├── observability.py     # OpenTelemetry setup (one-line config)
│   └── mcp/
│       ├── __init__.py
│       ├── github.py        # pinned-version wrapper around official GitHub MCP server
│       ├── logs.py          # thin first-party Loki + Datadog logs client (smaller audit surface)
│       └── runbook.py       # Notion / local-markdown runbook fetcher
├── evals/
│   ├── README.md
│   ├── scenarios/           # 30 anonymised PagerDuty incidents (target; 0 in v0)
│   └── run.py               # harness: pass/fail per scenario + per-category breakdown
├── docker/
│   ├── Dockerfile           # read-only FS, no host network, allowlisted egress
│   └── docker-compose.yml   # opinionated sandbox config the buyer can run as-is
└── SECURITY.md              # pinned versions, audit notes vs April 2026 RCE class
```

## Status

This is the **scaffold** committed at the start of cycle 1. Files marked `# TODO` are intentional placeholders that get filled in over the 14 days per the plan on LIN-4.

## Local dev

```bash
cd agent
uv sync                        # or: pip install -e .
uvicorn triagepack.webhook:app --reload --port 8081
```

Then fire a canned PagerDuty payload at it:

```bash
curl -X POST http://localhost:8081/v1/incidents \
  -H "Content-Type: application/json" \
  -d @evals/scenarios/canned-pagerduty.json
```

(That fixture lands on Day 2.)

## Required environment

```
ANTHROPIC_API_KEY=...
GITHUB_TOKEN=...               # scoped to the affected repos only
SLACK_BOT_TOKEN=...            # chat:write to the target channel
SLACK_CHANNEL_ID=...
LOKI_URL=...                   # OR DATADOG_API_KEY + DATADOG_APP_KEY
NOTION_TOKEN=...               # OR RUNBOOK_DIR=/path/to/local/markdown
OTEL_EXPORTER_OTLP_ENDPOINT=...   # optional; defaults to noop exporter
```

## Hard rules baked into the design

- **No outbound network calls outside the allowlist.** The Docker sandbox enforces this; the application also refuses to start if it sees an unexpected MCP server in its config.
- **No tool execution beyond read.** This agent reads alerts, repos, logs, and runbooks. It does not deploy, restart, or page anyone. Suggestions only.
- **Confidence floor.** If the model's confidence on the suggested fix is below `CONFIDENCE_FLOOR` (default 0.6), the Slack post says "needs human" instead of proposing a fix.
