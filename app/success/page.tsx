import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { PRODUCT } from "@/lib/product";
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
          If you just paid and landed here, check your email. The receipt has the GitHub release link.
        </p>
        <Link href="/" className="mt-6 inline-block text-zinc-300 underline">
          back home
        </Link>
      </main>
    );
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);
  await db.select().from(purchases).where(eq(purchases.stripeSessionId, session_id)).limit(1);

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-sm uppercase tracking-widest text-emerald-400">Payment received</p>
      <h1 className="mt-3 text-4xl font-semibold">Thanks. {PRODUCT.name} is yours.</h1>
      <p className="mt-4 text-zinc-300">
        We've emailed the signed release link to <strong>{session.customer_details?.email}</strong>. You can also fetch it now:
      </p>

      <a
        href={`/api/download?session_id=${session_id}`}
        className="mt-8 inline-block rounded-md bg-zinc-100 px-6 py-3 text-lg font-medium text-zinc-900 hover:bg-white"
      >
        Get the release
      </a>

      <section className="mt-12 rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500">First five minutes</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-zinc-200">
          <li>Verify the release signature with <code className="text-zinc-400">cosign</code> (commands in the README).</li>
          <li>Boot the agent in the recommended Docker sandbox: <code className="text-zinc-400">docker compose up</code>.</li>
          <li>Run the bundled eval suite to confirm the build passes on your infra.</li>
          <li>Point your PagerDuty webhook at <code className="text-zinc-400">/v1/incidents</code> and fire a test alert.</li>
        </ol>
      </section>

      <p className="mt-12 text-sm text-zinc-500">
        Stuck? Reply to your receipt. That hits the founder's inbox.
      </p>
    </main>
  );
}
