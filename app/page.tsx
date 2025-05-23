import { PRODUCT } from "@/lib/product";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <header>
        <p className="mb-3 text-sm uppercase tracking-widest text-emerald-400">
          For SRE and DevOps teams running Claude in production
        </p>
        <h1 className="text-5xl font-semibold leading-tight">{PRODUCT.name}</h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-300">{PRODUCT.tagline}</p>
      </header>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        {PRODUCT.pillars.map((p) => (
          <div key={p.title} className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-base font-semibold text-zinc-100">{p.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{p.body}</p>
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="mb-4 text-2xl font-semibold">Pricing</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PRODUCT.prices.map((price) => (
            <form
              key={price.type}
              action="/api/checkout"
              method="post"
              className="rounded-lg border border-zinc-800 bg-zinc-950 p-6"
            >
              <input type="hidden" name="priceType" value={price.type} />
              <p className="text-sm uppercase tracking-wider text-zinc-500">{price.label}</p>
              <p className="mt-2 text-3xl font-semibold">{price.unit}</p>
              <button
                type="submit"
                className="mt-6 w-full rounded-md bg-zinc-100 px-4 py-2 font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
                disabled={!price.stripePriceId}
              >
                {price.stripePriceId ? "Buy now" : "Join waitlist"}
              </button>
            </form>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Stripe live mode flips when the security checklist is signed off. Until then both buttons drop you on the waitlist.
        </p>
      </section>

      <section className="mt-16 max-w-xl">
        <h2 className="mb-3 text-2xl font-semibold">Get notified</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Drop your email and we'll send the signed v1 release the moment it ships.
        </p>
        <form className="flex gap-2" action="/api/subscribe" method="post">
          <input
            type="email"
            name="email"
            required
            placeholder="you@your-domain.com"
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder:text-zinc-500"
          />
          <button
            type="submit"
            className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-zinc-950 hover:bg-emerald-400"
          >
            Notify me
          </button>
        </form>
      </section>

      <footer className="mt-24 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
        Built for SRE teams who don't want another agent installed without an audit trail. Working name <code className="text-zinc-400">{PRODUCT.workingTitle}</code>.
      </footer>
    </main>
  );
}
