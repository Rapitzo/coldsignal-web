# Triage rubric (v0.1, tuned on 2k real cold emails)

## Scoring (0–100)

Add points where the signal is present. Subtract where the anti-signal is present. Cap at 0/100.

### Positive signals
- Specific, named reference to operator's recent public work (post, talk, repo, product) — **+25**
- Concrete ask with a clear next step (book 15 min / try a thing / give feedback on X) — **+15**
- Sender's domain matches a real company (corporate domain, not gmail/outlook) AND domain >12 months old — **+10**
- Sender title is decision-maker for the ask (founder/head/director, matched to ask) — **+10**
- Short (<150 words) — **+10**
- Includes a specific number (revenue, headcount, %) that grounds the claim — **+5**
- Reply-to matches sender, not a relay — **+5**

### Negative signals
- Mass-merge artefacts: `{{first_name}}`, "I noticed your company" with no specifics — **−40**
- Pitches a service the operator obviously already has (e.g. "we do SEO" to a SEO agency) — **−25**
- Long (>400 words) without a clear ask — **−15**
- Linkedin connection request copy-paste — **−15**
- Hashed-tracking links only, no real signal in body — **−10**
- All-caps subject or three+ exclamation marks — **−10**
- Sender domain registered <90 days — **−15**

### Hard kills (score → 0, label → spam)
- Crypto / SEO link-farm / "guest post on your site" pitches
- "I have a client interested in buying your domain"
- Anything matching the operator's own domain spoofed
- Attachment-only emails with no body

## Label bands

| Score | Label | Action |
|------:|:------|:-------|
| 70–100 | `hot` | draft a reply, label, surface in daily digest |
| 40–69 | `warm` | draft a short ack-or-defer, label |
| 1–39 | `spam` | label, archive, never resurface |
| 0 | `spam` (hard kill) | label, archive |
| any, with money/contract/HR ask | `needs-human` | label, leave in inbox |

## Edge cases

- **Investor outreach**: bump +20 if fund is named and has a thesis fit; otherwise treat as cold.
- **Recruiter pings**: label `needs-human` unless explicitly routed to a recruiter-handling alias.
- **Press / podcast invites**: `warm` minimum; draft includes a link to the operator's media page.
- **Vendor cold pitches**: even if well-written, max `warm` unless the operator has an open RFP for that category.

## Re-tuning

The numbers above are starting points. Run the eval suite (`evals/run.ts`) against your own labelled corpus and tune the weights until per-label F1 is north of 0.8. Most operators end up moving the "specific reference" weight up and the "short body" weight down.
