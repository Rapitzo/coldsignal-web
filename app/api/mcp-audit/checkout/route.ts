import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const AUDIT_PRICE_USD_CENTS = 49900;

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? process.env.PUBLIC_URL ?? "";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: AUDIT_PRICE_USD_CENTS,
          product_data: {
            name: "MCP server stack audit",
            description:
              "Independent audit against the April 2026 MCP RCE class. 5 business day turnaround.",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/mcp-audit/booked?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/mcp-audit`,
    metadata: { product: "mcp-audit-v1" },
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
