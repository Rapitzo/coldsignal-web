// Single-product config for Swarm E1 (Incident Triage Agent v1, working name "triagepack").
// One landing page, two prices. No catalogue, no /packs/[slug] pages.

export type Price = {
  type: "monthly" | "onetime";
  label: string;
  amountUsd: number;
  unit: string;
  caption?: string;
  stripePriceId: string | null;
};

export const PRODUCT = {
  slug: "incident-triage",
  name: "Incident Triage Agent",
  workingTitle: "triagepack",
  eyebrow: "For on-call SRE and DevOps teams who'd like quieter nights.",
  tagline:
    "An audited agent that takes a PagerDuty alert and posts to Slack a proposed RCA, the suspected commit, the relevant log lines, and a confidence score.",
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
      caption: "Cancel any time. Includes ongoing audited updates.",
      stripePriceId: null,
    },
    {
      type: "onetime",
      label: "One-time licence",
      amountUsd: 499,
      unit: "$499 one-time",
      caption: "10 months, then yours. Updates for 12 months included.",
      stripePriceId: null,
    },
  ] satisfies Price[],
  // GitHub release URL the buyer is redirected to (private repo, access granted by webhook on purchase)
  releaseUrl: process.env.TRIAGEPACK_RELEASE_URL ?? null,
};
