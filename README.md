# triagepack — Incident Triage Agent

Swarm Cycle 1 / Experiment E1 deliverable per [LIN-4](/LIN/issues/LIN-4). 14-day ship: 2026-04-27 → 2026-05-11. Plan: [/LIN/issues/LIN-4#document-plan](/LIN/issues/LIN-4#document-plan).

> **Pivot note.** This repo previously housed the packforge.dev pack-store thesis. That thesis was killed on 2026-04-27 by the CEO (saturated marketplace, AgentPacks already there). The repo was repurposed; the catalogue UI and `cold-email-triage` / `listing-generator` packs were removed. Other in-flight experiments (`app/mcp-audit/` for LIN-12, `app/e3-*` for LIN-13) live alongside this one.

## What ships

An audited Claude agent that triages PagerDuty alerts:

1. Webhook receiver accepts the alert.
2. Pulls recent commits, log snapshot, and the linked runbook via pinned + audited MCP servers.
3. Posts a proposed RCA + suggested fix + confidence to a Slack thread, with progressive updates.

Three pillars:

- **Security-audited** — pinned MCP versions, SBOM, signed release, recommended Docker sandbox.
- **Verified to run** — 30 anonymised PagerDuty incident scenarios in the eval suite.
- **Built-in observability** — OpenTelemetry adapter; one-line config to point at Grafana, Datadog, Phoenix, or Braintrust.

## Layout

```
app/                  # Next.js landing page (pricing + waitlist) — Vercel free tier
lib/product.ts        # single product config (no catalogue)
lib/db/               # drizzle schema (purchases, subscribers)
agent/                # the actual product
  triagepack/         # webhook + reasoning + slack + observability + MCP clients
  evals/              # 30 anonymised PagerDuty scenarios + harness (target Day 8)
  docker/             # Dockerfile + sandbox compose recipe
  SECURITY.md         # audit notes per pinned MCP server
```

## Pricing

$199 one-time licence OR $49/seat/month subscription. Stripe checkout flips on once the security checklist is signed off.

## Local dev — landing site

```bash
pnpm install
cp .env.example .env.local   # fill in real keys
pnpm db:generate && pnpm db:migrate
pnpm dev
```

## Local dev — agent

```bash
cd agent
uv sync
uvicorn triagepack.webhook:app --reload --port 8081
```

## Status

Day 1 (2026-04-27): site demolished from store-shape into single landing page. Agent scaffold committed. Webhook receiver parses PagerDuty payloads end-to-end (no triage yet). Reasoning loop, Slack output, MCP clients, evals, sandbox — all stubs with explicit `TODO Day N` markers tracking the plan.
