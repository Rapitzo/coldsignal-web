import type { Metadata } from "next";
import { PRODUCT } from "@/lib/product";

export const metadata: Metadata = {
  title: `Install ${PRODUCT.name} — MCP server + Docker webhook`,
  description:
    "Install triagepack as an MCP server (Claude Desktop, Cline) or as a self-hosted Docker webhook for PagerDuty / Datadog / Opsgenie. One licence, both delivery shapes.",
  openGraph: {
    title: `Install ${PRODUCT.name}`,
    description:
      "MCP server + Docker webhook install for triagepack. Audited, pinned MCP versions, signed releases.",
    type: "article",
  },
};

type SearchParams = { source?: string | string[] };

const CLAUDE_DESKTOP_CONFIG = `{
  "mcpServers": {
    "triagepack": {
      "command": "uvx",
      "args": ["--from", "triagepack", "triagepack-mcp"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "GITHUB_TOKEN": "ghp_...",
        "LOKI_URL": "https://logs.example.com"
      }
    }
  }
}`;

const CLINE_CONFIG = `{
  "triagepack": {
    "command": "uvx",
    "args": ["--from", "triagepack", "triagepack-mcp"],
    "disabled": false,
    "autoApprove": []
  }
}`;

const DOCKER_SNIPPET = `docker run --rm \\
  -p 8080:8080 \\
  --read-only --cap-drop=ALL \\
  -e ANTHROPIC_API_KEY=sk-ant-... \\
  -e SLACK_BOT_TOKEN=xoxb-... \\
  ghcr.io/packforge/triagepack:0.1.0`;

export default async function InstallPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const rawSource = Array.isArray(params.source) ? params.source[0] : params.source;
  const source = rawSource ?? "";
  const onetime = PRODUCT.prices.find((p) => p.type === "onetime");
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <header>
        <p className="mb-3 text-sm uppercase tracking-widest text-emerald-400">
          Install — {PRODUCT.name}
        </p>
        <h1 className="text-4xl font-semibold leading-tight">
          Two ways to run triagepack
        </h1>
        <p className="mt-4 text-lg text-zinc-300">
          Same audited core, two delivery shapes. Pick whichever fits the on-call workflow.
        </p>
      </header>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">1. MCP server (Claude Desktop, Cline, agent runtimes)</h2>
        <p className="mt-3 text-zinc-300">
          Install the <code className="text-zinc-100">triagepack-mcp</code> stdio server. Exposes one tool —
          {" "}<code className="text-zinc-100">triage_incident(source, payload)</code> — accepting raw PagerDuty,
          Datadog, or Opsgenie webhook bodies.
        </p>

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Claude Desktop
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          Drop into <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS)
          or the equivalent on Windows.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-200">
{CLAUDE_DESKTOP_CONFIG}
        </pre>

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Cline / Cursor / generic MCP host
        </h3>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-200">
{CLINE_CONFIG}
        </pre>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">2. Webhook + Docker (PagerDuty / Datadog / Opsgenie direct)</h2>
        <p className="mt-3 text-zinc-300">
          Self-host the FastAPI receiver. Point your incident provider at <code>POST /v1/incidents</code>;
          the agent pulls context, posts a proposed RCA to Slack, and emits OpenTelemetry spans.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-200">
{DOCKER_SNIPPET}
        </pre>
        <p className="mt-3 text-xs text-zinc-500">
          Image is read-only filesystem with all capabilities dropped. Network egress is allowlisted to
          the MCP backends you configure (GitHub, your logs provider, Notion).
        </p>
      </section>

      <section className="mt-14 rounded-lg border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="text-2xl font-semibold">Get a licence</h2>
        <p className="mt-2 text-zinc-300">
          Both delivery shapes ship from the same signed release. One licence covers both.
        </p>
        {onetime ? (
          <form action="/api/checkout" method="post" className="mt-5 flex flex-wrap items-center gap-4">
            <input type="hidden" name="priceType" value={onetime.type} />
            <input type="hidden" name="source" value={source} />
            <span className="text-2xl font-semibold">{onetime.unit}</span>
            <button
              type="submit"
              className="rounded-md bg-zinc-100 px-5 py-2 font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
              disabled={!onetime.stripePriceId}
            >
              {onetime.stripePriceId ? "Buy licence" : "Join waitlist"}
            </button>
          </form>
        ) : null}
      </section>

      <footer className="mt-20 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
        Trouble installing? Email <a href="mailto:support@packforge.dev" className="text-zinc-300 underline">support@packforge.dev</a>.
      </footer>
    </main>
  );
}
