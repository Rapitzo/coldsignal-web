# outreach/

Canonical home for any cold email, DM, or marketplace-submission text the
company sends out, plus the runbook for the **approval-gated send loop**.

If you're looking for the AgentPacks cold mail, it's
[`agentpacks-coldmail.md`](./agentpacks-coldmail.md).

## The send loop (Phase 1 — email)

```
agent drafts        ┐
   ↓                │
outreach-email-draft skill            (creates approval card)
   ↓                │
POST /api/companies/.../approvals     (request_board_approval)
   ↓                │
[ board sees ONE card with full body, clicks approve / decline / edit ]
   ↓                │
Paperclip wakes the sender agent with PAPERCLIP_APPROVAL_ID
   ↓                │
outreach-email-send skill             (reads approval payload, calls Resend)
   ↓                │
POST https://api.resend.com/emails    (real send)
   ↓                │
agent comments back on the source issue with Resend message id + status
```

Idempotency: the sender refuses to send the same `approvalId` twice.

## What's wired so far

- [`agentpacks-coldmail.md`](./agentpacks-coldmail.md) — first email queued for this rail.
- `lib/outreach/resend.ts` — typed Resend client wrapper used by the send skill.
- Skills (live in the company skills folder, not in this repo):
  - `outreach-email-draft` — produces draft + approval card.
  - `outreach-email-send` — fires after approval.

## What's pending board action

| Step | Owner | Status |
|---|---|---|
| Pick sending domain | Board | Recommend `packforge.dev` |
| Create Resend account at [resend.com](https://resend.com) | Board | Pending |
| Add domain in Resend dashboard | Board | Pending |
| Drop DNS records at registrar (TXT × 3) | Board | Pending — Resend generates them after domain is added |
| Paste API key into `.env.local` as `RESEND_API_KEY` | Board → CTO | Pending |

Resend free tier covers 100/day, 3 000/mo. Plenty for cycle 1.

## Where the API key goes

```
.env.local        (gitignored — never committed)
RESEND_API_KEY=re_xxx_yyy
RESEND_FROM_DOMAIN=packforge.dev
RESEND_REPLY_TO=hello@packforge.dev   # whatever inbox the board reads
```

The sender skill reads these from `process.env`. If `RESEND_API_KEY` is
missing, the skill exits with a board-action-required comment instead of
attempting a send.

## What's NOT in this folder

- LinkedIn / HN / IH messages — no API, sent manually. Drafts live as issue
  documents on the relevant Paperclip issue (e.g. discovery DMs on
  [LIN-5](/LIN/issues/LIN-5)).
- X (Twitter) posts and DMs — Phase 2, lives under SocialX agent.
- GitHub outreach — Phase 3.

## Adding a new email outreach

1. Drop the draft as a markdown file in this folder
   (`outreach/<short-name>.md`). Subject in frontmatter, body below.
2. Open or reuse a Paperclip issue. Reference the file in the description.
3. Run the draft skill against that issue — it creates the approval card.
4. Wait for approval. Sender agent fires after.
5. Sent log lands as a comment on the same issue.
