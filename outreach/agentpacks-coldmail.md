# Marketplace outreach + submission notes (E3)

The product: **triagepack** — incident triage agent for SRE/DevOps. Two
delivery shapes from the same core:

- **Webhook + Docker** (`triagepack.webhook`) — receives PagerDuty/Datadog/
  Opsgenie events, runs Claude reasoning over commits/logs/runbook context,
  posts a proposed RCA to Slack. Self-hosted by the buyer.
- **MCP server** (`triagepack.mcp_server`, console script `triagepack-mcp`) —
  exposes a `triage_incident(source, payload)` tool. Intended for MCP-server
  marketplaces (mcp-marketplace.io, MCPize) and Claude Desktop / Cline users.

Pricing: match LIN-4 Coldsignal list price (no channel
discount, per CEO ruling on 2026-04-28).

## AgentPacks.ai — contact@agentpacks.ai

**Status:** drafted, not sent. Board to send manually per LIN-17,
fallback EOD 2026-04-29 → drop AgentPacks if no human send.

```
Subject: Third-party pack submission — incident triage agent for SRE

Hi,

I run engineering at Coldsignal. We've built triagepack — an audited Claude
agent that triages PagerDuty/Datadog/Opsgenie alerts, gathers context via
GitHub + logs + runbook MCP servers, and posts a proposed RCA to Slack.
Ships as a signed Docker image with read-only FS and allowlisted egress;
also exposed as an MCP server for Claude Desktop / Cline buyers.

A couple of questions before we send anything over:

1. Do you take outside packs today, or is the storefront first-party only?
2. If you do, what's the submission and review process, and what's the
   revenue split?
3. Any format requirements beyond what's on the public product pages?

Happy to send a sample build and a short demo if useful.

Thanks,
[CEO name] — Coldsignal
```

## MCP Market (mcpmarket.com/submit)

Web form. Fields to prepare:

- Name: triagepack
- One-liner: Audited incident triage for SRE — Claude agent that pulls
  commits, logs, and runbook context for any PagerDuty/Datadog/Opsgenie
  alert and posts a proposed RCA to Slack.
- Use cases: PagerDuty on-call, Datadog monitor noise reduction, post-incident
  RCA drafting.
- Requirements: Anthropic API key; GitHub MCP server; Loki or Datadog logs;
  Notion or local-markdown runbook.
- Type: MCP server (`triagepack-mcp`) + Docker webhook artefact.
- Pricing: link to Coldsignal Stripe checkout (price = LIN-4 list price).
- Repo / docs: https://coldsignal.dev/triagepack (TBC).
- Listing URL params: append `?source=e3-mcpmarket` to the checkout link so
  Stripe metadata tags the sale.

## mcp-marketplace.io — paid listing

**Verified 2026-04-28:** docs claim 85/15 rev share, Stripe payouts, license
keys, creator A+/F reputation grading. No independent transaction data
visible — treat as "submit and see" rather than a sure bet.

Submission steps:

1. Create creator account; connect Stripe.
2. Submit listing with same content as MCP Market above.
3. Set price to match LIN-4. Use one-time payment for v0; revisit subscription
   at Day-14 review.

## MCPize (mcpize.com)

Day-5 decision per CEO. If MCP-server form (`triagepack-mcp`) is stable and
mcp-marketplace.io is processing, file MCPize next. If MCPize is the only
real signal, this becomes our primary paid channel for cycle 2.

## Smithery + mcp.so

Free discovery only. List the MCP server. Description points to
`coldsignal.dev/triagepack?source=e3-smithery` (or `e3-mcpso`).

## Stripe attribution

Channel allowlist is set in [`lib/attribution.ts`](../lib/attribution.ts):
`agentpacks`, `mcpmarket`, `mcpize`, `smithery`, `mcpso`, `mcpmarketplaceio`.
Add new channels there before pointing a new listing at the checkout.
