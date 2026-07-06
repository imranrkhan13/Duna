import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Pronunciation Scoring Assessment",
  description:
    "Deterministic pronunciation scoring for English speech with DPDP-conscious temporary processing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900 antialiased">{children}</body>
    </html>
  );
}
