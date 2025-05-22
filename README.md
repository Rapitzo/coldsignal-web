# Packforge

First-revenue v0 for the **B′** direction approved by the board on [LIN-2](/LIN/issues/LIN-2): an agent-template / skill-pack store for people trying to make money with AI. Name approved on [LIN-4](/LIN/issues/LIN-4) (2026-04-27): **packforge.dev**.

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind
- Neon Postgres + Drizzle ORM
- Stripe Checkout (test mode → live)
- Resend (fulfilment email) · PostHog free tier (analytics, TBD)
- Vercel hosting (`packforge.vercel.app` until DNS flips to packforge.dev)

## Local dev

```bash
pnpm install
cp .env.example .env.local   # fill in real keys
pnpm db:generate && pnpm db:migrate
pnpm dev
```

## Layout

```
app/                       # routes (landing, packs, changelog, success, api)
lib/packs.ts               # pack catalogue (source of truth for v0)
lib/db/                    # drizzle schema + client
lib/stripe.ts              # Stripe SDK singleton
packs/cold-email-triage/   # actual pack artefacts (the product)
```

## Status

Domain `packforge.dev` registration + Vercel/Neon/Stripe wiring pending (external — needs human-in-the-loop). First pack (`cold-email-triage`) artefacts under construction in `packs/cold-email-triage/`.
