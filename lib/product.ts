// Single-product config for Swarm E1 (Incident Triage Agent v1, working name "triagepack").
// One landing page, two prices. No catalogue, no /packs/[slug] pages.

export type Price = {
  type: "monthly" | "onetime";
  label: string;
  amountUsd: number;
  unit: string;
  stripePriceId: string | null;
};

export const PRODUCT = {
  slug: "incident-triage",
  name: "Incident Triage Agent",
  workingTitle: "triagepack",
  tagline:
    "An audited Claude agent that triages PagerDuty alerts, pulls the right context via MCP, and posts a proposed RCA to Slack before your on-call finishes their coffee.",
  pillars: [
    {
      title: "Security-audited",
      body: "v0.1 ships zero third-party MCP servers in the runtime sandbox. Every dependency pinned, audited against the April 2026 RCE class, and shipped with SBOM, signed release, and an egress-allowlisted Docker sandbox config.",
    },
    {
      title: "Verified to run",
      body: "30 anonymised PagerDuty incident scenarios in the eval suite. Pass-rate ships with the release; you can re-run on your own infra.",
    },
    {
      title: "Built-in observability",
      body: "OpenTelemetry baked into the agent core. One-line config to point spans at Grafana, Datadog, Phoenix, or Braintrust.",
    },
  ],
  prices: [
    {
      type: "monthly",
      label: "Per seat / month",
      amountUsd: 49,
      unit: "$49 / seat / month",
      stripePriceId: null,
    },
    {
      type: "onetime",
      label: "One-time licence",
      amountUsd: 199,
      unit: "$199 one-time",
      stripePriceId: null,
    },
  ] satisfies Price[],
  // GitHub release URL the buyer is redirected to (private repo, access granted by webhook on purchase)
  releaseUrl: process.env.TRIAGEPACK_RELEASE_URL ?? null,
};
