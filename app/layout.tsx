import type { Metadata } from "next";
import "./globals.css";
import { startCronJobs } from "@/lib/cron";

export const metadata: Metadata = {
  title: "PANDORA — The Living Technology Organism",
  description:
    "PANDORA is an independent technology organism shaping humanity's future. Think. Build. Evolve.",
};

if (typeof window === "undefined") {
  startCronJobs();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}