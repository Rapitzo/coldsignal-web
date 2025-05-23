import { NextResponse } from "next/server";
import { PRODUCT } from "@/lib/product";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const form = await req.formData();
  const priceType = String(form.get("priceType") ?? "");
  const price = PRODUCT.prices.find((p) => p.type === priceType);

  if (!price || !price.stripePriceId) {
    const origin = req.headers.get("origin") ?? "/";
    return NextResponse.redirect(`${origin}/?waitlist=1#notify`, { status: 303 });
  }

  const origin = req.headers.get("origin") ?? process.env.PUBLIC_URL ?? "";
  const session = await stripe.checkout.sessions.create({
    mode: price.type === "monthly" ? "subscription" : "payment",
    line_items: [{ price: price.stripePriceId, quantity: 1 }],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
    metadata: { product: PRODUCT.slug, priceType: price.type },
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
