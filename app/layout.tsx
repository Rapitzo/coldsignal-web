import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Incident Triage Agent — audited Claude agent for SRE on-call",
  description:
    "An audited Claude agent that triages PagerDuty alerts, pulls context via MCP, and posts a proposed RCA to Slack. Pinned MCP versions, signed releases, 30 eval scenarios in the box.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
