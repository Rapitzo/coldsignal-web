import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pack store — agent kits for people shipping with AI",
  description:
    "Polished agent templates, prompt libraries, and skill packs you can buy once and ship today.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
