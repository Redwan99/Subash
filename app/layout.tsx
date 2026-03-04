import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "./providers";
import { TopNavbar } from "@/components/layout/TopNavbar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Subash | Bangladesh's Fragrance Community",
    template: "%s | Subash",
  },
  description:
    "Bangladesh's premier community-driven fragrance encyclopedia. Discover, review, and find authentic perfumes. বাংলাদেশের সেরা পারফিউম কমিউনিটি।",
  keywords: [
    "perfume",
    "fragrance",
    "Bangladesh",
    "পারফিউম",
    "সুগন্ধি",
    "Lattafa",
    "decant",
    "buy perfume BD",
  ],
  authors: [{ name: "Subash Team" }],
  creator: "Subash",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "bn_BD",
    alternateLocale: "en_US",
    siteName: "Subash",
    title: "Subash | Bangladesh's Fragrance Community",
    description:
      "Discover, review, and buy authentic perfumes in Bangladesh.",
    images: ["/og-default.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Subash | Bangladesh's Fragrance Community",
    description: "Discover, review, and buy authentic perfumes in Bangladesh.",
    images: ["/og-default.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

import { getFeatureMap } from "@/lib/features";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const featureToggles = await getFeatureMap();

  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} bg-ambient-dynamic text-gray-900 dark:text-gray-100 min-h-screen antialiased flex flex-col scrollbar-thin overflow-x-hidden`}
        suppressHydrationWarning
      >
        <Providers>
          <TopNavbar featureToggles={featureToggles} />
          <div className="flex flex-col flex-1 relative">
            {/* Global padding to prevent TopNavbar overlap */}
            <div className="flex-grow pt-[var(--topnav-height,60px)]">
              {children}
            </div>
          </div>
          {/* Floating Chat Widget — shown globally */}
          {featureToggles.ENABLE_AI_BOT !== false && <ChatWidget />}
        </Providers>
      </body>
    </html>
  );
}
