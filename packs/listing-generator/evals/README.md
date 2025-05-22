# Eval suite (listing generator)

12 SKU → expected-copy pairs in v0.1, expanding to 40 in v0.2.

## What this scores

For each SKU the harness returns three numbers:

1. **Schema compliance** — does the model output match `prompts/schema.json`. Hard pass/fail.
2. **Factuality** — did the model invent any feature, material, dimension, or origin not in the input row. LLM-as-judge against the input. Reported as % of cases without invented attributes.
3. **Tone match** — does the output read like the calibrated brand-tone preset. LLM-as-judge using your tightened prompt as the rubric. Score 0-100.

## Running

The runner script (`run.ts`) ships in v0.2. v0.1 ships the cases and the rubric so you can wire up your own runner today if you're impatient. Format below.

## Case format

```json
{
  "id": "case-001",
  "sku": { "sku": "...", "name": "...", "category": "...", "key_features": ["..."], "materials": "...", "dimensions": "...", "audience": "..." },
  "voice": "founder | editorial | direct-response | brand",
  "expected": {
    "must_mention": ["linen", "82cm"],
    "must_not_mention": ["luxurious", "perfect"],
    "factuality_hard_facts": ["material is linen", "size is 82x70cm"]
  }
}
```

The harness checks `must_mention` / `must_not_mention` lexically and uses `factuality_hard_facts` as the truth set for the factuality judge.
