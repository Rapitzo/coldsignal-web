import Link from "next/link";
import { PACKS } from "@/lib/packs";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <header className="mb-16">
        <p className="mb-3 text-sm uppercase tracking-widest text-zinc-400">
          Picks &amp; shovels for the AI-agent gold rush
        </p>
        <h1 className="text-5xl font-semibold leading-tight">
          Production-grade agent packs.
          <br />
          <span className="text-zinc-400">Buy once. Ship today.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-300">
          Polished Claude Skills, prompt libraries, and starter flows for the use cases that
          actually generate revenue. Bring your own keys. Keep your margin.
        </p>
        <form
          className="mt-8 flex max-w-md gap-2"
          action="/api/subscribe"
          method="post"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="you@domain.com"
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder:text-zinc-500"
          />
          <button
            type="submit"
            className="rounded-md bg-zinc-100 px-4 py-2 font-medium text-zinc-900 hover:bg-white"
          >
            Notify me on launch
          </button>
        </form>
      </header>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">Featured packs</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {PACKS.map((pack) => (
            <Link
              key={pack.slug}
              href={`/packs/${pack.slug}`}
              className="group rounded-lg border border-zinc-800 bg-zinc-950 p-6 transition hover:border-zinc-600"
            >
              <p className="text-xs uppercase tracking-wider text-zinc-500">{pack.audience}</p>
              <h3 className="mt-2 text-xl font-semibold group-hover:text-white">{pack.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{pack.tagline}</p>
              <p className="mt-4 text-sm text-zinc-300">£{pack.priceGbp} · one-off</p>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-24 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
        Built in public ·{" "}
        <Link href="/changelog" className="underline hover:text-zinc-300">
          changelog
        </Link>
      </footer>
    </main>
  );
}
