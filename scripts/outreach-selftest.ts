/**
 * Self-test for the outreach email rail.
 *
 * Usage (after RESEND_API_KEY + RESEND_FROM_DOMAIN are set in .env.local):
 *
 *   pnpm tsx scripts/outreach-selftest.ts <recipient@board.address>
 *
 * Sends a single plain-text email through the Resend wrapper, prints the
 * message id on success, exits non-zero on failure. Does NOT use the
 * approval flow - this is the bypass path for proving the wiring before
 * any real outreach goes through it.
 */
import { isResendConfigured, sendEmail } from "../lib/outreach/resend";

for (const f of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(f);
  } catch {
    // missing file is fine; isResendConfigured() will surface real errors
  }
}

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error("usage: pnpm tsx scripts/outreach-selftest.ts <to>");
    process.exit(2);
  }

  if (!isResendConfigured()) {
    console.error(
      "RESEND_API_KEY or RESEND_FROM_DOMAIN missing. See outreach/README.md.",
    );
    process.exit(2);
  }

  const stamp = new Date().toISOString();
  const result = await sendEmail({
    to,
    subject: `Outreach rail self-test (${stamp})`,
    text: [
      "This is a self-test from the outreach rail.",
      "",
      "If you're reading this, the Resend wiring works:",
      "  - API key valid",
      "  - Sending domain verified",
      "  - From address resolves",
      "",
      `Sent at: ${stamp}`,
      "",
      "Reply with anything to confirm replyTo lands in the right inbox.",
    ].join("\n"),
    tags: [
      { name: "channel", value: "selftest" },
      { name: "stage", value: "phase1-wiring" },
    ],
  });

  if (!result.ok) {
    console.error("FAIL:", result.error);
    process.exit(1);
  }
  console.log("OK", result.messageId);
}

main().catch((err) => {
  console.error("crash:", err);
  process.exit(1);
});
