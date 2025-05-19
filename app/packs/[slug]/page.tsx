import Link from "next/link";
import { notFound } from "next/navigation";
import { PACKS } from "@/lib/packs";

export function generateStaticParams() {
  return PACKS.map((p) => ({ slug: p.slug }));
}

export default async function PackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pack = PACKS.find((p) => p.slug === slug);
  if (!pack) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← all packs
      </Link>
      <h1 className="mt-4 text-4xl font-semibold">{pack.title}</h1>
      <p className="mt-3 text-lg text-zinc-300">{pack.tagline}</p>
      <p className="mt-6 text-zinc-400">{pack.description}</p>

      <section className="mt-10">
        <h2 className="mb-3 text-sm uppercase tracking-wider text-zinc-500">What's in the pack</h2>
        <ul className="space-y-1 text-zinc-200">
          {pack.artefacts.map((a) => (
            <li key={a}>· {a}</li>
          ))}
        </ul>
      </section>

      <form action="/api/checkout" method="post" className="mt-10">
        <input type="hidden" name="slug" value={pack.slug} />
        <button
          type="submit"
          className="rounded-md bg-zinc-100 px-6 py-3 text-lg font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          disabled={!pack.stripePriceId}
        >
          {pack.stripePriceId ? `Buy for £${pack.priceGbp}` : "Coming soon — join waitlist"}
        </button>
      </form>
    </main>
  );
}
