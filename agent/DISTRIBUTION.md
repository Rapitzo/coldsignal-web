# Distribution submission prep — Smithery + MCP Market

triagepack v0.1 is listed on two third-party catalogues at ship: Smithery and MCP Market. The own-domain landing page (the Next.js site in this repo) is the primary buying surface; the catalogue listings are discovery channels that link back. This file is the source-of-truth copy for both submissions, plus the audit-claim language we have permission to use.

## Listing copy (one paragraph, ~70 words)

> Audited Claude agent for incident triage. Takes a PagerDuty alert and posts to Slack: a proposed RCA, the suspected commit, the relevant log lines, a confidence score. Below the confidence floor it posts "needs human" with no fix shown. Ships with 30-scenario eval suite, SBOM, signed release attestation, and a Docker sandbox with a hardcoded egress allowlist. v0.1 ships zero third-party MCP servers in the runtime sandbox. Measured pass-rate publishes as v0.1.1 release asset by 2026-05-12.

## One-line description

> Audited PagerDuty → Slack incident-triage agent. Proposed RCA, suspected commit, log evidence, confidence score. Below threshold = needs-human.

## Long description (Smithery profile, ~250 words)

triagepack is an audited Claude agent that triages on-call alerts. The pitch is narrow on purpose: a webhook receiver listens for PagerDuty (Datadog and Opsgenie payloads also map onto the same internal `Alert` type), the agent gathers context from three sources in parallel (recent commits to the affected service, log snapshot around the alert time, the linked runbook), then asks Claude to produce a JSON object with a root-cause hypothesis, a suggested fix, and a confidence score in [0, 1]. The output goes to a Slack channel as a Block Kit card with three explicit no-write action buttons (Ack, Mark resolved, Page on-call) routed to the buyer's own Slack app — the agent never executes a click.

Three pillars, all present at v1:

- **Security-audited.** v0.1 ships zero third-party MCP servers in the runtime sandbox. The three context sources are first-party REST clients we wrote, audit, and pin ourselves. The Docker recipe enforces a hardcoded egress allowlist (Anthropic, GitHub, Slack, PagerDuty, Notion, Datadog) via a tinyproxy sidecar; anything else 403s. SBOM (CycloneDX + SPDX) and SLSA v1 provenance attestation ship with every release.
- **Verified to run.** 30-scenario eval suite based on anonymised PagerDuty incidents across infra/app/data/auth. v0.1 ships unmeasured by design (key-provisioning constraint); measured pass-rate publishes as a v0.1.1 release asset (`baseline.json`) by 2026-05-12 — 1 week after ship. Buyers can re-run on their own infra at any time.
- **Built-in observability.** OpenTelemetry built into the agent core. One line of config points spans at Grafana, Datadog, Phoenix, or Braintrust.

## Audit-claim language (legal-safe)

We can say:

- **"Audited against the April 2026 MCP RCE class"** — we have the per-source audit notes in `agent/SECURITY.md` and a cosign attestation on the release that binds the claim to a specific build.
- **"Zero third-party MCP servers in the runtime sandbox"** — verifiable from `pyproject.toml` and the Docker recipe.
- **"Egress-allowlisted"** — verifiable from `docker/proxy.conf` and `docker/filter`.
- **"SBOM ships with every release"** — verifiable from the GitHub release assets.

We cannot say (yet, per the honesty rail):

- "X% pass rate" — only after the eval harness has run with the current build and `agent/evals/baseline.json` has `measured: true`. Submission text uses "30-scenario eval suite" pre-measurement and switches to "X/30 pass" post-measurement.
- "Production-tested" — until we have a buyer running it in a non-toy environment.
- "SOC 2" / "ISO 27001" — neither applies; do not imply.

## Submission checklist

### Smithery (smithery.ai)

- [ ] Create profile under `coldsignal/triagepack`.
- [ ] Upload listing copy (long description above).
- [ ] Upload screenshots (3): Slack card high-confidence, Slack card needs-human, eval suite output.
- [ ] Set categories: `devops`, `incident-response`, `observability`.
- [ ] Add link to the GitHub release (signed v0.1).
- [ ] Add link to the own-domain landing page.
- [ ] Add the audit-claim text exactly as listed above; do not paraphrase.

### MCP Market (mcpmarket.com)

- [ ] Create listing under "Operations / SRE".
- [ ] Same long description, same screenshots.
- [ ] Tag: `pagerduty`, `slack`, `audited`, `claude`.
- [ ] Link to GitHub release as the install path.

### Both — gating

Submissions go in **after** Day 13 final eval run + Day 13 release tag is signed and promoted. We do not submit a draft listing pre-ship; the audit claim is the wedge and we want the listing to point at a verifiable release the moment a reader clicks.

## Day-14 outreach (one-line callouts)

Each of the 30 cold messages must include this line, prominent (not buried in a footer):

> Pass-rate landing as v0.1.1 release asset by 2026-05-12 — 1 week after ship. Eval suite is in the repo; you can re-run before then on your own key.

Rationale: shipping unmeasured plus a public commitment is more honest than hand-waving. The line is the single biggest credibility move we have to offset the missing number on the landing page.

## Screenshots needed (Day 12)

Three at most, all from the actual agent in TEST mode against canned scenarios:

1. **Slack card, high-confidence path.** Use scenario `001-redis-eviction-storm`. Show the severity emoji, the RCA, the suggested fix, and the three action buttons.
2. **Slack card, needs-human path.** Use scenario `029-flapping-thin-signal`. Show the explicit "needs human" block with no fix proposed and the confidence number visible.
3. **Eval harness output.** Run `make evals-baseline` against the current build, screenshot the terminal showing the pass-rate + per-category breakdown + failure list.

Store screenshots in `artifacts/screenshots/` (gitignored at `agent/.gitignore`); upload to listings out-of-band.
