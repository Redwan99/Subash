import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "./providers";
import { TopNavbar } from "@/components/layout/TopNavbar";
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
        className={`${inter.variable} ${playfair.variable} antialiased scrollbar-thin overflow-x-hidden`}
        suppressHydrationWarning
      >
        <Providers>
          <TopNavbar featureToggles={featureToggles} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
