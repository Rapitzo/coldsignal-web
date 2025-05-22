import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Audit booked — Packforge",
};

export default function BookedPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold">Audit booked.</h1>
      <p className="mt-4 text-zinc-300">
        Stripe has your payment. Within one business day we will email you a short
        questionnaire — repo links, deploy targets, which tools your MCP servers expose,
        and how the model gets to them. Reports go out within five business days of us
        getting that back.
      </p>
      <p className="mt-8 text-sm text-zinc-500">
        Wrong email on file? Reply to the Stripe receipt and we will redirect.
      </p>
      <p className="mt-8">
        <Link href="/mcp-audit" className="text-sm underline hover:text-zinc-300">
          Back to audit page
        </Link>
      </p>
    </main>
  );
}
