import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db/client";
import { purchases } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const signingKey = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !signingKey) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, signingKey);
  } catch (err) {
    return NextResponse.json({ error: `invalid: ${(err as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const packSlug = session.metadata?.packSlug;
    const email = session.customer_details?.email;
    if (packSlug && email && session.amount_total != null) {
      await db
        .insert(purchases)
        .values({
          email,
          packSlug,
          stripeSessionId: session.id,
          amountGbpPence: session.amount_total,
        })
        .onConflictDoNothing();
    }
  }

  return NextResponse.json({ received: true });
}
