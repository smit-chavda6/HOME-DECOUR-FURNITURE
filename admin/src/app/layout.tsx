import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Bricolage_Grotesque, Schibsted_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-display-face", subsets: ["latin"] });
const body = Schibsted_Grotesk({ variable: "--font-body", subsets: ["latin"] });
const mono = Space_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "700"] });
const serif = Bodoni_Moda({ variable: "--font-serif-face", subsets: ["latin"], style: ["italic"] });

// Every page is rendered per request, so each one gets the fresh CSP nonce
// from proxy.ts (static HTML could not carry it) and is never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · HD Admin" },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
