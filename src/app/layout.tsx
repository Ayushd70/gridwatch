import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteChrome";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const site = "https://gridwatch.ayushd70.dev";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "Gridwatch — unofficial fan timing",
    template: "%s · Gridwatch",
  },
  description:
    "Live session timing, championship tables, and the race calendar for racing fans. Unofficial.",
  applicationName: "Gridwatch",
  authors: [{ name: "Ayush Dubey", url: "https://ayushd70.dev" }],
  creator: "Ayush Dubey",
  keywords: [
    "timing board",
    "grand prix",
    "OpenF1",
    "Jolpica",
    "fan timing",
    "championship",
  ],
  alternates: { canonical: site },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: site,
    siteName: "Gridwatch",
    title: "Gridwatch — unofficial fan timing",
    description:
      "Live session timing, championship tables, and the race calendar. Unofficial fan project.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gridwatch — unofficial fan timing",
    description:
      "Live session timing, championship tables, and the race calendar. Unofficial fan project.",
  },
  appleWebApp: {
    capable: true,
    title: "Gridwatch",
    statusBarStyle: "black-translucent",
    startupImage: "/logo.png",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
