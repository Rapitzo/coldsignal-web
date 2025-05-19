import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { subscribers } from "@/lib/db/schema";

const Body = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const form = await req.formData();
  const parsed = Body.safeParse({ email: form.get("email") });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  await db
    .insert(subscribers)
    .values({ email: parsed.data.email, source: "landing" })
    .onConflictDoNothing();

  const origin = req.headers.get("origin") ?? "/";
  return NextResponse.redirect(`${origin}/?subscribed=1`, { status: 303 });
}
