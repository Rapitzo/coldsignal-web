export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  fromName?: string;
  tags?: { name: string; value: string }[];
};

export type SendEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; status?: number };

const RESEND_URL = "https://api.resend.com/emails";

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_DOMAIN);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_FROM_DOMAIN;
  if (!key || !domain) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY or RESEND_FROM_DOMAIN missing - board action required, see outreach/README.md",
    };
  }

  const fromName = input.fromName ?? "Packforge";
  const from = `${fromName} <hello@${domain}>`;
  const replyTo = input.replyTo ?? process.env.RESEND_REPLY_TO ?? from;

  const headers = new Headers({ "Content-Type": "application/json" });
  headers.set("Authorization", `Bearer ${key}`);

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      reply_to: replyTo,
      tags: input.tags,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: body || res.statusText, status: res.status };
  }

  const json = (await res.json()) as { id?: string };
  if (!json.id) return { ok: false, error: "Resend response missing id" };
  return { ok: true, messageId: json.id };
}
