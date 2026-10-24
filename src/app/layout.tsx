import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import MenuDrawer from "@/components/MenuDrawer";
import InstallPrompt from "@/components/InstallPrompt";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrailTap | Tap the trail. Discover what's next.",
  description:
    "Plates on the waymark posts of the Cotswold Way: tap or scan one for the story of where you're standing, and the nearest water, food and toilets.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#154212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-body bg-background text-on-surface overflow-x-hidden">
        {children}
        <MenuDrawer />
        <InstallPrompt />
        <script
          dangerouslySetInnerHTML={{
            // Offline support only in production: in development the files keep their names
            // between edits, so the worker's cache-first copies would serve stale CSS and JS.
            __html:
              process.env.NODE_ENV === "production"
                ? `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `
                : `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
                if (window.caches) caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
