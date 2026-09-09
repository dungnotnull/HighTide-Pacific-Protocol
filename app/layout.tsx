import type { Metadata } from "next";
import "./globals.css";

import { SITE_URL } from "@/lib/site";

const SITE_TITLE =
  "HighTide: Repaying the Carbon Debt";
const SITE_DESCRIPTION =
  "Pacific Island Countries pollute the least yet pay the most. HighTide is an AI-forecasted, blockchain-triggered Loss & Damage protocol that pays Pacific communities automatically when sea levels rise, funded by historical carbon debt.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  keywords: [
    "climate change",
    "pacific islands",
    "sea level rise",
    "WASH",
    "carbon debt",
    "loss and damage",
    "smart contracts",
    "blockchain",
    "emissions",
    "HighTide",
    "Pacific Data Hub"
  ],
  authors: [
    { name: "Ngoc Nguyen" },
    { name: "Dung Truong" },
    { name: "Lan Nguyen" },
    { name: "Thu Truong" }
  ],
  creator: "Hapri Vietnam Team",
  publisher: "Hapri Vietnam Team",
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "HighTide Protocol",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HighTide: Repaying the Carbon Debt",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@HapriVietnamTeam",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}