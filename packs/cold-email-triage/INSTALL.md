# Cold-email triage agent — install guide

A working triage system for an inbound cold-email mailbox. Drops into Gmail (via Gmail API) or any IMAP account.

## What you get

```
cold-email-triage/
├── INSTALL.md              # this file
├── skill/                  # Claude Skill bundle (drop into ~/.claude/skills/)
│   ├── SKILL.md            # skill definition + when to trigger
│   ├── triage-rules.md     # the scoring + categorisation rubric
│   └── reply-templates.md  # tone-matched draft templates
├── n8n/
│   └── cold-email-triage.workflow.json   # importable n8n flow
├── evals/
│   ├── README.md
│   ├── cases.jsonl         # 50 anonymised real cold emails with expected labels
│   └── run.ts              # scoring harness (Node 20+, no deps beyond fetch)
└── examples/
    └── demo.gif            # 30s walkthrough
```

## 5-minute setup (n8n path)

1. Spin up n8n (`npx n8n`) or use n8n cloud.
2. Import `n8n/cold-email-triage.workflow.json`.
3. Set credentials:
   - **Gmail OAuth** (or IMAP host/user/app-password)
   - **Anthropic API key** — `ANTHROPIC_API_KEY`
4. Activate the workflow. It polls every 2 minutes by default.
5. Triaged emails get one of four labels applied: `cold/hot`, `cold/warm`, `cold/spam`, `cold/needs-human`. Drafts are saved against `cold/hot` and `cold/warm` only.

## Claude Skill path

If you'd rather run inside Claude Code or the API:

1. Copy `skill/` into `~/.claude/skills/cold-email-triage/`.
2. Pipe inbox JSON into Claude — the skill auto-triggers on the trigger phrases in `SKILL.md`.

## Re-tuning for your niche

Run `evals/run.ts` against your own labelled set:

```bash
cd evals
ANTHROPIC_API_KEY=sk-... node --experimental-strip-types run.ts cases.jsonl
```

The harness prints per-label precision/recall. Tweak `skill/triage-rules.md` until you're happy, re-run, ship.

## Support

Questions: reply to your purchase receipt — that hits the founder's inbox directly. Bug fixes are free for life of the pack; major v2s are a discounted upgrade.
