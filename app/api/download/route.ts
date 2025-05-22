import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { stripe } from "@/lib/stripe";
import { PACKS } from "@/lib/packs";

export const runtime = "nodejs";

// Re-verifies the Stripe session before streaming the pack zip.
// v0: zips on demand from packs/<slug>/. Move to S3 + signed URLs once we have >1 sale/day.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: "missing session_id" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "payment not complete" }, { status: 402 });
  }

  const slug = session.metadata?.packSlug;
  const pack = PACKS.find((p) => p.slug === slug);
  if (!pack || !slug) return NextResponse.json({ error: "pack not found" }, { status: 404 });

  const packDir = resolve(process.cwd(), "packs", slug);

  // Pipe a zip stream straight to the response. Uses system `zip` (Vercel runtime has it).
  const zip = spawn("zip", ["-r", "-q", "-", "."], { cwd: packDir });

  const stream = new ReadableStream({
    start(controller) {
      zip.stdout.on("data", (chunk) => controller.enqueue(chunk));
      zip.stdout.on("end", () => controller.close());
      zip.on("error", (err) => controller.error(err));
    },
    cancel() {
      zip.kill();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${slug}.zip"`,
      "cache-control": "no-store",
    },
  });
}
