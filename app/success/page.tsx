import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { PACKS } from "@/lib/packs";
import { db } from "@/lib/db/client";
import { purchases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-3xl font-semibold">Missing session.</h1>
        <p className="mt-4 text-zinc-400">
          If you just paid and landed here, check your email — the receipt has the download link.
        </p>
        <Link href="/" className="mt-6 inline-block text-zinc-300 underline">
          back to packs
        </Link>
      </main>
    );
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);
  const slug = session.metadata?.packSlug;
  const pack = PACKS.find((p) => p.slug === slug);

  if (!pack || !slug) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-3xl font-semibold">Payment received, pack not found.</h1>
        <p className="mt-4 text-zinc-400">
          Reply to your receipt — we'll sort it within a few hours.
        </p>
      </main>
    );
  }

  // The webhook records the purchase. If the user lands here before the webhook fires,
  // we still let them proceed — the download endpoint re-verifies against Stripe.
  await db.select().from(purchases).where(eq(purchases.stripeSessionId, session_id)).limit(1);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-sm uppercase tracking-widest text-emerald-400">Payment received</p>
      <h1 className="mt-3 text-4xl font-semibold">Thanks. Your pack is ready.</h1>
      <p className="mt-4 text-zinc-300">
        We've sent a copy to <strong>{session.customer_details?.email}</strong>. Grab it now too:
      </p>

      <a
        href={`/api/download?session_id=${session_id}`}
        className="mt-8 inline-block rounded-md bg-zinc-100 px-6 py-3 text-lg font-medium text-zinc-900 hover:bg-white"
      >
        Download {pack.title}
      </a>

      <section className="mt-12 rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500">First five minutes</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-200">
          <li>Unzip into a working directory.</li>
          <li>Open <code className="text-zinc-400">INSTALL.md</code> — pick the n8n or Claude Skill path.</li>
          <li>Run the eval suite against the bundled cases to confirm everything works.</li>
          <li>Re-tune <code className="text-zinc-400">skill/triage-rules.md</code> for your niche, re-run the evals, ship.</li>
        </ol>
      </section>

      <p className="mt-12 text-sm text-zinc-500">
        Stuck? Just reply to your receipt — that hits the founder's inbox.
      </p>
    </main>
  );
}
