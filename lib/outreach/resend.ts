import { Resend } from "resend";

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
  | { ok: false; error: string };

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_DOMAIN);
}

export function fromAddress(fromName?: string): string {
  const domain = process.env.RESEND_FROM_DOMAIN ?? "example.invalid";
  const name = fromName ?? process.env.RESEND_FROM_NAME ?? "Outreach";
  return `${name} <hello@${domain}>`;
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

  const resend = new Resend(key);
  const replyTo = input.replyTo ?? process.env.RESEND_REPLY_TO ?? fromAddress();

  const { data, error } = await resend.emails.send({
    from: fromAddress(input.fromName),
    to: input.to,
    subject: input.subject,
    text: input.text,
    replyTo,
    tags: input.tags,
  });

  if (error) return { ok: false, error: error.message ?? String(error) };
  if (!data?.id) return { ok: false, error: "Resend response missing id" };
  return { ok: true, messageId: data.id };
}
