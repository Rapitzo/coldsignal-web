import { NextResponse } from "next/server";
import { PRODUCT } from "@/lib/product";
import { resolveAttribution } from "@/lib/attribution";
import { getStripe, stripeMode } from "@/lib/stripe";

export async function POST(req: Request) {
  const form = await req.formData();
  const priceType = String(form.get("priceType") ?? "");
  const source = String(form.get("source") ?? "");
  const price = PRODUCT.prices.find((p) => p.type === priceType);
  const mode = stripeMode();

  // Pre-Stripe-live, route any checkout POST to the waitlist anchor. The
  // landing page already does this client-side via the form action, but a
  // direct POST (e.g. someone reusing the URL) lands here without a price ID
  // and we redirect rather than 404.
  if (!price || !price.stripePriceId || mode === "absent") {
    const origin = req.headers.get("origin") ?? "/";
    return NextResponse.redirect(`${origin}/#waitlist`, { status: 303 });
  }

  const attribution = resolveAttribution(source);
  const origin = req.headers.get("origin") ?? process.env.PUBLIC_URL ?? "";
  const session = await getStripe().checkout.sessions.create({
    mode: price.type === "monthly" ? "subscription" : "payment",
    line_items: [{ price: price.stripePriceId, quantity: 1 }],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
    metadata: {
      product: PRODUCT.slug,
      priceType: price.type,
      stripe_mode: mode,
      attribution_experiment: attribution.experiment,
      attribution_channel: attribution.channel,
    },
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
