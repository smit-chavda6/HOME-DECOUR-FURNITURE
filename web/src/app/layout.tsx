import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Preloader } from "@/components/layout/preloader";
import { preloaderSkipScript, themeInitScript } from "@/lib/inline-scripts";
import { site, siteUrl } from "@/lib/site";
import "./globals.css";

// A precise modern sans for everything, with an italic serif for accent words.
const body = Geist({
  variable: "--font-body",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-serif-face",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  openGraph: { siteName: site.name, locale: "en_IN", type: "website" },
  title: {
    default: `${site.name} — furniture you can place in your room`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${body.variable} ${serif.variable} h-full antialiased`}
    >
      <head>
        {/* Both run before the first paint: saved theme, and skip the intro for returning visitors. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript + ";" + preloaderSkipScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Preloader />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <ChatWidget />
      </body>
    </html>
  );
}
