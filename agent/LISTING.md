# Marketplace listing copy — triagepack

Copy-paste-ready content for marketplace submission forms. One source of
truth so MCP Market, AgentPacks, mcp-marketplace.io, MCPize and any future
channel describe the pack identically. Update here first; submissions next.

## Name

`triagepack`

## One-liner (≤140 chars)

> Audited Claude agent that triages PagerDuty / Datadog / Opsgenie alerts
> and posts a proposed RCA to Slack — with pinned MCP context.

## Short description (~300 chars)

> triagepack is an audited Claude agent for SRE on-call. It receives an
> incident, gathers context (recent commits via GitHub MCP, fresh logs
> from Loki or Datadog, the linked Notion runbook), proposes a likely
> root cause and a concrete fix with a calibrated confidence score, and
> posts to Slack. Suggests; never acts.

## Long description (~1500 chars)

When PagerDuty fires at 03:14, the on-call's first three minutes are spent
gathering the same context every time: what shipped recently, what the logs
look like right now, what the runbook says. triagepack does that fan-out
in parallel and posts a structured proposal to the incident's Slack
channel before the on-call has finished their coffee.

What's in the box:

- **The agent core** (Python 3.12, FastAPI). One webhook receiver
  (`POST /v1/incidents`), source-agnostic alert type, adapters for
  PagerDuty Webhook v3, Datadog webhooks, and Opsgenie.
- **Pinned MCP wrappers** for GitHub, Loki / Datadog logs, and Notion /
  local-markdown runbooks. Every backend version is locked and audited
  against the April 2026 RCE class. SBOM ships with the release.
- **Slack output** (Block Kit). A single threaded message per incident
  with RCA, suggested fix, confidence score, and "needs human" flag.
- **OpenTelemetry** baked into the agent core. One-line config to
  point spans at Grafana, Datadog, Phoenix, or Braintrust.
- **30 anonymised PagerDuty incident scenarios** in the eval suite,
  with a scoring harness you can re-run on your own infra.
- **Read-only Docker sandbox** with allowlisted egress, ready to drop
  into your cluster.

Hard rule: triagepack suggests, humans act. It never proposes a deploy,
restart, traffic shift, or page action. If evidence is thin, confidence
drops below 0.6 and the agent says what additional signal would resolve
the ambiguity.

## Use cases

- PagerDuty / Datadog / Opsgenie on-call rotations that want a faster
  first three minutes per incident.
- Post-incident RCA drafting where you want a defensible starting point,
  not a hallucination.
- Teams running Claude in production who need an MCP-pinned, audited
  pack instead of a hand-rolled agent.

## Requirements

- Anthropic API key.
- One of: PagerDuty, Datadog, or Opsgenie webhook source.
- One of: Loki or Datadog logs.
- One of: Notion runbook database, or a local-markdown runbook directory.
- Slack workspace with a bot user (Block Kit posting).
- For the MCP-server delivery shape: any MCP host (Claude Desktop, Cline,
  Cursor, custom).

## Permissions / scope

- Outbound HTTPS to: api.anthropic.com, api.github.com, your logs endpoint,
  api.notion.com (if used), slack.com.
- Inbound webhook on the port you choose (default 8080) from the incident
  provider's documented IP ranges.
- No filesystem writes (read-only image).
- No host-network access required.

## Pricing

- Per-seat / month: $49.
- One-time licence: $199.

(Match values from `lib/product.ts`. Do not channel-discount in cycle 1.)

## Links

- Product page: https://packforge.dev/?source=e3-{channel}
- Install instructions: https://packforge.dev/install?source=e3-{channel}
- Source / SBOM: https://github.com/packforge/triagepack (private until v1)
- Support: support@packforge.dev

Replace `{channel}` per-listing: `mcpmarket`, `agentpacks`, `mcpize`,
`mcpmarketplaceio`, `smithery`, `mcpso`. The allowlist lives in
`lib/attribution.ts`.

## Suggested categories / tags

`sre`, `devops`, `incident-management`, `pagerduty`, `datadog`,
`opsgenie`, `slack`, `observability`, `claude`, `mcp`.

## Asset checklist (for screenshot-driven marketplaces)

- [ ] Hero image: side-by-side of a PagerDuty incident → Slack post.
- [ ] 30s demo: alert → context fan-out → Slack message.
- [ ] Eval pass-rate badge from `evals/run.py` (per-category).

(All TODO — flag whichever channel needs them first.)
