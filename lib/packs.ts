export type Pack = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  priceGbp: number;
  stripePriceId: string | null;
  artefacts: string[];
  audience: string;
};

export const PACKS: Pack[] = [
  {
    slug: "cold-email-triage",
    title: "Cold-email triage agent",
    tagline:
      "Sort, score, and draft replies on inbound — Claude Skill + n8n flow you can ship to a client this week.",
    description:
      "Drops into Gmail or any IMAP. Triage rules tuned on 2k real cold emails, eval suite included so you can re-tune for any niche.",
    priceGbp: 79,
    stripePriceId: null,
    artefacts: ["Claude Skill bundle", "n8n workflow JSON", "eval suite", "demo gif", "INSTALL.md"],
    audience: "AI freelancers, SMB ops",
  },
  {
    slug: "listing-generator",
    title: "Listing & product-description generator",
    tagline:
      "Prompt + eval pack that writes high-converting product descriptions at scale, from a CSV of SKUs.",
    description:
      "Three voice presets, brand-tone calibration prompt, structured-output schema, and a 40-case eval suite so quality is provable.",
    priceGbp: 79,
    stripePriceId: null,
    artefacts: ["prompt library", "JSON schema", "eval suite (40 cases)", "starter CSV", "INSTALL.md"],
    audience: "E-comm operators, content agencies",
  },
];
