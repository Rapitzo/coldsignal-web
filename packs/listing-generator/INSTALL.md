# Listing & product-description generator — install guide

Turns a CSV of SKUs into on-brand product copy at scale, with structured output and a 40-case eval suite so quality is provable.

## What you get

```
listing-generator/
├── INSTALL.md              # this file
├── prompts/
│   ├── system.md           # main generator prompt (voice presets included)
│   ├── brand-tone.md       # one-shot brand-tone calibration prompt
│   └── schema.json         # structured-output JSON schema
├── starter.csv             # 10 example SKUs to verify the install
├── evals/
│   ├── README.md
│   ├── cases.jsonl         # 40 SKU → expected-copy pairs (first batch: 12; full 40 in v0.2)
│   └── run.ts              # scoring harness (Node 20+, no deps)
└── examples/
    └── output.json         # what a successful run looks like
```

## 5-minute setup

1. Drop your SKU CSV into the working directory. Required columns: `sku`, `name`, `category`, `key_features` (semicolon-separated). Optional: `materials`, `dimensions`, `audience`.
2. Pick a voice preset in `prompts/system.md` (`founder`, `editorial`, or `direct-response`).
3. Run the generator (rough wiring, point it at any Anthropic-compatible client):

```
input.csv → split rows → per row, call Claude with system.md + schema.json → write to output.json
```

A reference implementation in n8n + a one-file Node script land in v0.2.

## Brand-tone calibration

Paste 3-5 examples of copy you already love into `prompts/brand-tone.md`. Run the calibration prompt once; it returns a tightened system prompt that mirrors your voice. Use the tightened prompt instead of the generic one going forward.

## Re-tuning

Run `evals/run.ts` against your own labelled outputs. The harness scores on:

- schema compliance (hard pass/fail)
- brand-tone match (LLM-as-judge using your tightened prompt as the rubric)
- factuality (does the copy invent attributes not in the input row)

Tune the prompt until factuality is 100% and tone match is north of 85%.

## Status

v0.1 — prompts + schema + 12 starter eval cases ready. Full 40-case eval set and end-to-end runner script land in v0.2 (week 2). Buyers on v0.1 get v0.2 free.
