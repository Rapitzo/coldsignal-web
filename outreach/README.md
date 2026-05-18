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
| Pick sending domain | Board | Done — `contact.coldsignal.dev` (subdomain) |
| Create Resend account at [resend.com](https://resend.com) | Board | Done |
| Add domain in Resend dashboard | Board | Done |
| Drop DNS records at registrar (TXT × 3) | Board | Done |
| Paste API key into `.env.local` as `RESEND_API_KEY` | Board → CTO | Pending — file not yet on disk |

Resend free tier covers 100/day, 3 000/mo. Plenty for cycle 1.

## Where the API key goes

```
.env.local        (gitignored — never committed)
RESEND_API_KEY=re_xxx_yyy
RESEND_FROM_DOMAIN=contact.coldsignal.dev
RESEND_FROM_NAME=Coldsignal
RESEND_REPLY_TO=hello@contact.coldsignal.dev   # whatever inbox the board reads
```

The verified sending domain is the **subdomain** `contact.coldsignal.dev` —
that's what's set up in Resend with DNS records live. Sender addresses
resolve to `hello@contact.coldsignal.dev`. The apex (`coldsignal.dev`) is
not a sending domain.

## Where replies land

Resend is send-only. Inbound for `*@contact.coldsignal.dev` is wired
through **Cloudflare Email Routing** — anything anyone replies to lands in
`rickardlind94@gmail.com`. Setup tracked in
LIN-21. If a reply doesn't show up there, the
routing is the first place to look.

The sender skill reads these from `process.env`. If `RESEND_API_KEY` is
missing, the skill exits with a board-action-required comment instead of
attempting a send.

## Self-test (proving the wiring before any real outreach)

After `RESEND_API_KEY` and `RESEND_FROM_DOMAIN` are in `.env.local`:

```
pnpm tsx scripts/outreach-selftest.ts you@board.address
```

Bypasses the approval flow on purpose — this exists to prove the rail itself
works (key valid, domain verified, from-address resolves) before any real
outreach goes through. Prints the Resend message id on success; check the
Resend dashboard to confirm "delivered".

## What's NOT in this folder

- LinkedIn / HN / IH messages — no API, sent manually. Drafts live as issue
  documents on the relevant Paperclip issue (e.g. discovery DMs on
  LIN-5).
- X (Twitter) posts and DMs — Phase 2, lives under SocialX agent.
- GitHub outreach — Phase 3.

## Adding a new email outreach

1. Drop the draft as a markdown file in this folder
   (`outreach/<short-name>.md`). Subject in frontmatter, body below.
2. Open or reuse a Paperclip issue. Reference the file in the description.
3. Run the draft skill against that issue — it creates the approval card.
4. Wait for approval. Sender agent fires after.
5. Sent log lands as a comment on the same issue.

## Inbound rail (replies)

Replies to `hello@contact.coldsignal.dev` are routed via **Cloudflare Email Routing** to `rickardlind94@gmail.com`. The routing is one named address, not a wildcard catch-all - Cloudflare does not support catch-all on subdomains, only on the zone apex.

If we add a new From-address (e.g. `noreply@contact.coldsignal.dev`), add a matching custom address in the Cloudflare dashboard under Email Routing ? Routes (with the `contact.coldsignal.dev` subdomain selected). Without that, replies to the new address will bounce.

DNS state on `contact.coldsignal.dev` (verified 2026-04-28):

- MX: `route1/2/3.mx.cloudflare.net` (Cloudflare receiving)
- TXT (SPF): `v=spf1 include:_spf.mx.cloudflare.net ~all`
- TXT (`resend._domainkey`): Resend DKIM, intact - DO NOT remove
- Outbound (Resend) and inbound (Cloudflare) coexist. Resend uses its own bounce domain for SMTP MAIL FROM, so the Cloudflare-only SPF on this subdomain does not break outbound SPF/DMARC. DMARC alignment runs via DKIM. Do not "fix" the SPF to add Resend - not needed.

History: see LIN-21.
