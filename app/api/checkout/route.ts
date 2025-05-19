import { NextResponse } from "next/server";
import { PACKS } from "@/lib/packs";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const form = await req.formData();
  const slug = String(form.get("slug") ?? "");
  const pack = PACKS.find((p) => p.slug === slug);
  if (!pack || !pack.stripePriceId) {
    return NextResponse.json({ error: "Pack not available" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? process.env.PUBLIC_URL ?? "";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: pack.stripePriceId, quantity: 1 }],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/packs/${pack.slug}`,
    metadata: { packSlug: pack.slug },
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
