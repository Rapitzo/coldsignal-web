export type PackStatus = "live" | "preorder" | "soon";

export type Pack = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  priceGbp: number;
  stripePriceId: string | null;
  artefacts: string[];
  audience: string;
  status: PackStatus;
  etaNote?: string;
};

export const PACKS: Pack[] = [
  {
    slug: "cold-email-triage",
    title: "Cold-email triage agent",
    tagline:
      "Sort, score, and draft replies on inbound. Claude Skill + n8n flow you can ship to a client this week.",
    description:
      "Drops into Gmail or any IMAP. Triage rules tuned on 2k real cold emails, 50-case eval suite included so you can re-tune for any niche.",
    priceGbp: 79,
    stripePriceId: null,
    artefacts: ["Claude Skill bundle", "n8n workflow JSON", "eval suite (50 cases)", "INSTALL.md"],
    audience: "AI freelancers, SMB ops",
    status: "preorder",
    etaNote: "Live within the week — Stripe wiring in flight.",
  },
  {
    slug: "listing-generator",
    title: "Listing & product-description generator",
    tagline:
      "Prompt pack that writes on-brand product copy at scale, from a CSV of SKUs.",
    description:
      "Three voice presets, brand-tone calibration prompt, structured-output schema, and a 40-case eval suite so quality is provable.",
    priceGbp: 79,
    stripePriceId: null,
    artefacts: ["prompt library", "JSON schema", "eval suite (40 cases)", "starter CSV", "INSTALL.md"],
    audience: "E-comm operators, content agencies",
    status: "soon",
    etaNote: "v0.1 prompts + 12 eval cases ready in repo. v0.2 (full evals + runner) lands next week.",
  },
];
