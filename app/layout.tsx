import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Packforge — agent kits for people shipping with AI",
  description:
    "Polished Claude Skills, prompt libraries, and starter flows for the agent use cases that actually pay. Buy once, keep your margin.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
