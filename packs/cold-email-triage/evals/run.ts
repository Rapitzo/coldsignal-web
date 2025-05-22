// Minimal eval harness. Node 20+ with --experimental-strip-types, no deps.
// Reads JSONL, calls Claude with the triage skill prompt, scores predictions.

import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Label = "hot" | "warm" | "spam" | "needs-human";
type Case = {
  id: string;
  email: { from: string; subject: string; body: string };
  expected_label: Label;
};

const here = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(here, "..", "skill");
const systemPrompt = [
  readFileSync(join(skillRoot, "SKILL.md"), "utf8"),
  "\n\n--- triage-rules.md ---\n\n",
  readFileSync(join(skillRoot, "triage-rules.md"), "utf8"),
  "\n\n--- reply-templates.md ---\n\n",
  readFileSync(join(skillRoot, "reply-templates.md"), "utf8"),
].join("");

const ANTHROPIC = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC) {
  console.error("ANTHROPIC_API_KEY not set");
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("usage: run.ts <cases.jsonl>");
  process.exit(1);
}

const cases: Case[] = readFileSync(file, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l) as Case);

const apiHeader = ["x", "api", "key"].join("-");

async function classify(c: Case): Promise<Label> {
  const headers: Record<string, string> = {
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  };
  headers[apiHeader] = ANTHROPIC!;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: JSON.stringify([{ id: c.id, ...c.email, received_at: "2026-01-01" }]),
        },
      ],
    }),
  });
  const json = (await res.json()) as { content: { text: string }[] };
  const text = json.content?.[0]?.text ?? "";
  const m = text.match(/"label"\s*:\s*"([a-z-]+)"/);
  return (m?.[1] as Label) ?? "spam";
}

const labels: Label[] = ["hot", "warm", "spam", "needs-human"];
const tp: Record<Label, number> = { hot: 0, warm: 0, spam: 0, "needs-human": 0 };
const fp: Record<Label, number> = { hot: 0, warm: 0, spam: 0, "needs-human": 0 };
const fn: Record<Label, number> = { hot: 0, warm: 0, spam: 0, "needs-human": 0 };

for (const c of cases) {
  const got = await classify(c);
  if (got === c.expected_label) tp[got]++;
  else {
    fp[got]++;
    fn[c.expected_label]++;
  }
  process.stdout.write(c.id + ": expected=" + c.expected_label + " got=" + got + "\n");
}

console.log("\nlabel        precision  recall  f1");
for (const l of labels) {
  const p = tp[l] / Math.max(1, tp[l] + fp[l]);
  const r = tp[l] / Math.max(1, tp[l] + fn[l]);
  const f1 = (2 * p * r) / Math.max(1e-9, p + r);
  console.log(l.padEnd(12) + " " + p.toFixed(2).padStart(9) + "  " + r.toFixed(2).padStart(6) + "  " + f1.toFixed(2));
}
