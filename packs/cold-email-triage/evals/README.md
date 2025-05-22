# Eval suite

50 anonymised cold emails with ground-truth labels. Use this to:

1. Verify the pack works on your install before you trust it.
2. Re-tune the rubric (`skill/triage-rules.md`) for your niche and prove the change moved precision/recall.

## Run

```bash
ANTHROPIC_API_KEY=sk-... node --experimental-strip-types run.ts cases.jsonl
```

Outputs per-label precision, recall, F1, and a confusion matrix. Costs ~$0.04 per full run on Claude Haiku 4.5.

## Format

`cases.jsonl` is one JSON object per line:

```json
{"id":"case-001","email":{"from":"...","subject":"...","body":"..."},"expected_label":"hot"}
```

## Notes on the corpus

- All emails anonymised: names, company names, and domains replaced; phone numbers and links removed.
- Distribution: 16% hot, 22% warm, 52% spam, 10% needs-human. Slightly heavier on the harder labels (hot, needs-human) than a typical inbox so the eval signal isn't drowned by easy spam.
- Add your own cases freely — the eval picks up everything in the file.
