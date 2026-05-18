# Changelog

All notable changes to triagepack are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.0] — Swarm Cycle 1 ship

First public release. Cycle 1 (2026-04-27 → 2026-05-11) per LIN-4.

### Added

- **Webhook receiver** (`triagepack/webhook.py`). FastAPI app exposing `GET /health` and `POST /v1/incidents`. PagerDuty payloads parsed via `from_pagerduty()` into the internal `Alert` type; Datadog and Opsgenie payloads map onto the same type by adapter.
- **Closed-by-default HMAC signature gate** on `/v1/incidents`. `PAGERDUTY_WEBHOOK_SECRET` required; missing env var or unsigned request returns 401. Constant-time compare via `hmac.compare_digest`. Multi-value `v1=` rotation header supported.
- **Reasoning loop** (`triagepack/reasoning.py`). Parallel fan-out to three first-party context sources (recent commits, log snapshot, runbook). Single Claude call returns JSON `{rca, suggested_fix, confidence}`. Confidence below `CONFIDENCE_FLOOR` (default 0.6) collapses to needs-human with no fix shown.
- **First-party MCP clients** under `triagepack/mcp/`: GitHub recent-commits (`api.github.com`), Loki/Datadog logs (`LogsBackend` protocol), Notion or local-markdown runbook fetcher. **No third-party MCP servers run inside the runtime sandbox** — this is the pillar 1 wedge claim.
- **Slack Block Kit output** (`triagepack/slack.py`). Initial card on alert, thread updates as triage completes. Three explicit no-write action buttons (Ack / Mark resolved / Page on-call) routed to the buyer's Slack app — agent never executes a click.
- **OpenTelemetry adapter** (`triagepack/observability.py`). Spans for `triage.run`, `triage.gather`, `triage.model_call`. OTLP/HTTP exporter; one-line config to point at Grafana, Datadog, Phoenix, or Braintrust. Documented in `OBSERVABILITY.md`.
- **Eval suite** at `agent/evals/scenarios/` — 30 anonymised PagerDuty scenarios across infra (6), app (8), data (8), auth (8). Harness in `evals/run.py`; pass = root_component or cause_family match AND a fix keyword in the agent's output. `--write-baseline` persists totals + per-category + calibration into `evals/baseline.json` (read at build by `lib/baseline.ts` to drive landing pillar 2 copy).
- **Egress-allowlisted Docker sandbox** at `agent/docker/`. Read-only root FS, `cap_drop: [ALL]`, `no-new-privileges`, non-root uid 10001, tmpfs `/tmp`. tinyproxy sidecar enforces a hardcoded host allowlist (Anthropic, GitHub, Slack, PagerDuty, Notion, Datadog).
- **SBOM pipeline** at `agent/scripts/build-sbom.sh`. CycloneDX + SPDX via syft for source tree and built image. `make sbom`.
- **Dependency audit** at `agent/scripts/audit.sh`. `pip-compile` resolves the pin set, `pip-audit --strict` blocks on any known CVE. `make audit`.
- **Signed release pipeline** at `agent/scripts/release.sh` and `.github/workflows/release.yml`. Tag `v*` triggers the workflow; build → audit → SBOM → cosign keyless sign (binds to org's GitHub Actions OIDC identity) → SLSA v1 provenance attestation → draft GitHub release with all artefacts attached.
- **Per-source security audit** in `agent/SECURITY.md`. Pass/fail rows for each context client against the April 2026 MCP RCE class. Verification recipes a buyer can run on the release artefacts. Known limitations section documents PagerDuty signature replay (no timestamp in spec) with bounded-effect reasoning and buyer-side mitigations.
- **Distribution copy** in `agent/DISTRIBUTION.md`. 70-word listing + 250-word long description + can-say/cannot-say audit-claim rules + Day-14 outreach callout.
- **Landing page** under `app/` (Next.js). Single product, three pillars, "Why we say audited" deep-dive, $49/mo + $499 one-time pricing with mode-aware buttons, waitlist with confirmation state.
- **Stripe TEST/LIVE mode gate** in `lib/stripe.ts`. `stripeMode()` returns `live | test | absent`. Live requires `sk_live_` key prefix AND `STRIPE_LIVE_MODE=true` (double-gated). Pricing footer copy is mode-aware.

### Pillar status at v0.1.0

- **Security-audited** ✅ — design + per-source audit + sandbox + SBOM + signed release CI, all in repo.
- **Verified to run** ⏳ — 30 scenarios shipped, **unmeasured** at this release. Measured pass-rate publishes as a v0.1.1 release asset (`baseline.json`) **by 2026-05-12** — public commitment mirrored on landing page, marketplace listings, release notes, and outreach. Buyers can run `make evals-baseline` against their own Anthropic key in the meantime.
- **Built-in observability** ✅ — OTel spans wired in the reasoning loop; one-line OTLP config documented.

### Honesty rail

`evals/run.py --write-baseline` always replaces `baseline.json` with the current run's results. No "best of N" selection logic. The Day-14 measurement (or whichever measurement runs last) is the published number, even if worse than an earlier run. Code comment in `run.py` records the rule.

### Cycle 1 kill/success criteria

- **Kill**: < 1 paid sale AND < 20 waitlist signups in 14 days from public ship.
- **Success**: ≥ 3 paid sales OR ≥ 50 waitlist signups in 14 days.

[v0.1.0]: ./CHANGELOG.md
