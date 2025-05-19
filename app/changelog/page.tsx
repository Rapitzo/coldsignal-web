import Link from "next/link";

type Post = { date: string; title: string; body: string };

const POSTS: Post[] = [
  {
    date: "2026-04-27",
    title: "Day 0 — building this in public",
    body: "Scaffolding the store on Next.js + Vercel + Neon + Stripe. Two launch packs in flight: cold-email triage and listing generator. Domain pending board pick. Nothing live yet — but you can read the plan in the LIN-4 ticket.",
  },
];

export default function ChangelogPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        ← home
      </Link>
      <h1 className="mt-4 text-4xl font-semibold">Changelog</h1>
      <p className="mt-2 text-zinc-400">Building this in public.</p>

      <ol className="mt-12 space-y-12">
        {POSTS.map((post) => (
          <li key={post.date}>
            <p className="text-sm uppercase tracking-wider text-zinc-500">{post.date}</p>
            <h2 className="mt-1 text-2xl font-semibold">{post.title}</h2>
            <p className="mt-3 text-zinc-300">{post.body}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
