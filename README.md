# Pack store (working name)

First-revenue v0 for the **B′** direction approved by the board on [LIN-2](/LIN/issues/LIN-2): an agent-template / skill-pack store for people trying to make money with AI.

Tracking issue: [LIN-4](/LIN/issues/LIN-4) · plan: [/LIN/issues/LIN-4#document-plan](/LIN/issues/LIN-4#document-plan).

## Stack

- Next.js 15 (App Router) · TypeScript · Tailwind
- Neon Postgres + Drizzle ORM
- Stripe Checkout (test mode for v0)
- Resend (email) · PostHog free tier (analytics, TBD)
- Vercel hosting (free tier; subdomain until domain approved)

## Local dev

```bash
pnpm install
cp .env.example .env.local   # fill in real keys
pnpm db:generate && pnpm db:migrate
pnpm dev
```

## Layout

```
app/                # routes (landing, packs, changelog, api)
lib/packs.ts        # pack catalogue (source of truth for v0)
lib/db/             # drizzle schema + client
lib/stripe.ts       # Stripe SDK singleton
```

## Status

Repo name pending CEO ack on [LIN-4](/LIN/issues/LIN-4). Stripe price IDs are `null` until first pack is QA'd and listed.
