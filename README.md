# triagepack — Incident Triage Agent

Swarm Cycle 1 / Experiment E1 deliverable per [LIN-4](/LIN/issues/LIN-4). 14-day ship: 2026-04-27 → 2026-05-11. Plan: [/LIN/issues/LIN-4#document-plan](/LIN/issues/LIN-4#document-plan).

> **Pivot note.** This repo previously housed an MCP pack-store thesis (the company has since rebranded to Coldsignal — see [LIN-17](/LIN/issues/LIN-17) and [LIN-19](/LIN/issues/LIN-19) for the rename history). That pack-store thesis was killed on 2026-04-27 by the CEO (saturated marketplace, AgentPacks already there). The repo was repurposed; the catalogue UI and `cold-email-triage` / `listing-generator` packs were removed. Other in-flight experiments (`app/mcp-audit/` for LIN-12, `app/e3-*` for LIN-13) live alongside this one.

## What ships

An audited Claude agent that triages PagerDuty alerts:

1. Webhook receiver accepts the alert.
2. Pulls recent commits, log snapshot, and the linked runbook via pinned + audited MCP servers.
3. Posts a proposed RCA + suggested fix + confidence to a Slack thread, with progressive updates.

Three pillars:

- **Security-audited** — v0.1 ships zero third-party MCP servers in the runtime sandbox. Every dependency pinned; per-source audit against the April 2026 MCP RCE class in [`agent/SECURITY.md`](agent/SECURITY.md). Egress allowlist enforced via tinyproxy sidecar in the Docker recipe. SBOM (CycloneDX + SPDX) and SLSA v1 provenance attestation ship with every release.
- **Verified to run** — 30 anonymised PagerDuty scenarios across infra/app/data/auth in [`agent/evals/`](agent/evals/). v0.1 ships unmeasured by design (key-provisioning constraint); measured pass-rate publishes as v0.1.1 release asset by 2026-05-12.
- **Built-in observability** — OpenTelemetry built into the reasoning loop. One line of config points spans at Grafana, Datadog, Phoenix, or Braintrust. See [`agent/OBSERVABILITY.md`](agent/OBSERVABILITY.md).

## Layout

```
app/                  # Next.js landing page (pricing + waitlist) — Vercel free tier
lib/product.ts        # single product config (no catalogue)
lib/baseline.ts       # reads agent/evals/baseline.json into pillar 2 copy
lib/db/               # drizzle schema (purchases, subscribers)
agent/                # the actual product
  triagepack/         # webhook + reasoning + slack + observability + first-party MCP clients
  evals/              # 30 anonymised scenarios + harness + baseline.json
  docker/             # Dockerfile + sandbox compose recipe + egress allowlist
  scripts/            # build-sbom.sh, audit.sh, release.sh
  tests/              # signature gate, slack block builders, alert adapters
  SECURITY.md         # per-source audit, known limitations, sign-off, verification recipes
  DISTRIBUTION.md     # Smithery + MCP Market submission copy + Day-14 outreach line
  OBSERVABILITY.md    # OTLP one-line configs for Grafana / Datadog / Phoenix / Braintrust
  RELEASE.md          # release runbook
  Makefile            # sbom, audit, build, sandbox-up/down, evals, evals-baseline, release
.github/workflows/release.yml  # canonical signed-release path (cosign keyless OIDC)
```

## Pricing

$499 one-time licence ("10 months, then yours") OR $49/seat/month subscription. Stripe lives in TEST mode until the security checklist is signed off and the operator flips `STRIPE_LIVE_MODE=true` against an `sk_live_` key.

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

**v0.1.0-rc1 tagged (2026-04-28).** Cycle 1 deliverables complete: webhook receiver with closed-by-default HMAC gate, reasoning loop with three first-party context sources, Slack Block Kit output (high-confidence and needs-human paths), 30-scenario eval suite, OpenTelemetry built in, egress-allowlisted Docker sandbox, SBOM/audit/release pipeline, signed-release CI workflow. Public ship blocked only on the operator-side `git push origin v0.1.0-rc1` against the canonical GitHub remote.

See [`CHANGELOG.md`](CHANGELOG.md) for the full v0.1.0 entry.
