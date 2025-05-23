import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PRODUCT } from "@/lib/product";

export const runtime = "nodejs";

// Re-verifies the Stripe session before redirecting to the signed GitHub release.
// The release URL is set via TRIAGEPACK_RELEASE_URL once the v1 binary is signed.
// Until then we return a 503 with a polite explanation rather than a broken redirect.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "missing session_id" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "payment not complete" }, { status: 402 });
  }

  if (!PRODUCT.releaseUrl) {
    return NextResponse.json(
      {
        status: "release_not_yet_signed",
        message:
          "The signed v1 release lands once the security checklist is signed off. We've recorded your purchase and will email the link the moment it ships.",
      },
      { status: 503 },
    );
  }

  return NextResponse.redirect(PRODUCT.releaseUrl, { status: 303 });
}
