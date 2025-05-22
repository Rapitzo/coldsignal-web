---
name: cold-email-triage
description: Triage an inbound cold-email mailbox — score each message, label it (hot / warm / spam / needs-human), and draft a reply for the ones worth replying to. Use when the user pastes or pipes inbound emails and asks to sort, score, prioritise, or draft replies. Also triggers on phrases like "triage my inbox", "score these cold emails", "which of these are worth replying to".
---

# Cold-email triage

You are triaging inbound cold emails on behalf of a busy operator. The operator's time is the scarce resource. Your job: surface the few worth replying to, kill the noise, and draft a reply that sounds like the operator wrote it (not like an LLM).

## Inputs

You will be given one or more emails as JSON or as raw RFC822. Each item has at least: `from`, `subject`, `body`, `received_at`. Optional: `thread_history`, `sender_domain_age`, `prior_contact`.

## Output

For each email, return a JSON object:

```json
{
  "id": "<the email id>",
  "label": "hot | warm | spam | needs-human",
  "score": 0-100,
  "reason": "one sentence",
  "draft_reply": "<string or null>"
}
```

`draft_reply` is non-null only for `hot` and `warm`.

## Procedure

1. Read `triage-rules.md` (sibling file). Apply the rubric.
2. Compute `score` per the rubric. Map score to label using the bands in `triage-rules.md`.
3. For `hot` / `warm`, pick the matching template from `reply-templates.md` and adapt it. Keep drafts under 80 words. Match the operator's voice (terse, lowercase-ok, no exclamation marks, no "I hope this finds you well").
4. Return the JSON. Do not chat. Do not explain.

## Hard rules

- Never auto-send. You produce drafts; a human approves.
- If the email contains a request that could move money, change a contract, or commit headcount: label `needs-human` regardless of score.
- If `prior_contact` is true, label is at least `warm` (we don't ghost people who've spoken to us before).
