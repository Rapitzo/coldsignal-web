import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP Audit — $499 per stack | Coldsignal",
  description:
    "Independent audit of your MCP server stack against the April 2026 RCE class. Five business days. $499 flat.",
};

export default function McpAuditPage({
  searchParams,
}: {
  searchParams?: { subscribed?: string };
}) {
  const subscribed = searchParams?.subscribed === "1";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
      <header className="mb-14">
        <p className="mb-3 text-sm uppercase tracking-widest text-zinc-400">
          MCP security audit
        </p>
        <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
          Get your MCP server stack audited against the April 2026 RCE class.
          <br />
          <span className="text-zinc-400">$499 per stack.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-300">
          200,000 MCP instances were left exposed. Nine of eleven public
          registries were proven poisonable. If you are running MCP servers in
          production, you want a second pair of eyes on it before someone else
          finds the gap first.
        </p>
      </header>

      <section className="mb-12 grid gap-4 sm:grid-cols-2">
        <Bullet
          title="What we check"
          body="Tool-poisoning vectors, registry trust chain, secrets in tool descriptions, command injection in argument handling, and exposure of internal endpoints to the model."
        />
        <Bullet
          title="What you get back"
          body="A written report ranked by severity, reproducible evidence for each finding, and a fix recommendation per item written for the engineer who has to apply it. Not a generic checklist."
        />
        <Bullet
          title="Turnaround"
          body="Five business days from when we receive your stack details. If we miss it, the audit is free."
        />
        <Bullet
          title="Who runs it"
          body="Us. Two engineers who have been shipping with MCP since the spec was first published. No subcontractors, no offshore review pool."
        />
      </section>

      <section className="mb-16 flex flex-col gap-4 sm:flex-row">
        <form action="/api/mcp-audit/checkout" method="post" className="flex-1">
          <button
            type="submit"
            className="w-full rounded-md bg-zinc-100 px-6 py-4 text-base font-semibold text-zinc-900 transition hover:bg-white"
          >
            Book audit · $499
          </button>
          <p className="mt-2 text-xs text-zinc-500">
            Stripe checkout. We email you a stack questionnaire after payment.
          </p>
        </form>

        <form
          action="/api/mcp-audit/waitlist"
          method="post"
          className="flex flex-1 flex-col gap-2"
        >
          <div className="flex gap-2">
            <input
              type="email"
              name="email"
              required
              placeholder="you@company.com"
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-500"
            />
            <button
              type="submit"
              className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 font-medium text-zinc-100 hover:border-zinc-500"
            >
              Get notified
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            {subscribed
              ? "You're on the list. We'll email when slots open."
              : "Not ready to buy? Get the next-batch availability email."}
          </p>
        </form>
      </section>

      <footer className="border-t border-zinc-800 pt-6 text-sm text-zinc-500">
        <p className="mb-2">References for the April 2026 MCP RCE disclosure:</p>
        <ul className="space-y-1">
          <li>
            <a
              className="underline hover:text-zinc-300"
              href="https://news.ycombinator.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hacker News discussion
            </a>
          </li>
          <li>
            <a
              className="underline hover:text-zinc-300"
              href="https://www.theregister.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              The Register coverage
            </a>
          </li>
          <li>
            <a
              className="underline hover:text-zinc-300"
              href="https://www.ox.security/"
              target="_blank"
              rel="noopener noreferrer"
            >
              OX Security writeup
            </a>
          </li>
        </ul>
      </footer>
    </main>
  );
}

function Bullet({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{title}</p>
      <p className="mt-2 text-sm text-zinc-200">{body}</p>
    </div>
  );
}
