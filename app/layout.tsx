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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="theme-color" content="#000000" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(reg => console.log('✅ Service Worker kaydedildi'))
                    .catch(err => console.log('❌ Service Worker hatası:', err));
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}