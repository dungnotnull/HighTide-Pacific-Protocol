import type { Metadata } from "next";
import "./globals.css";

import { SITE_URL } from "@/lib/site";

const SITE_TITLE =
  "A Pacific Climate Crisis - Seas Climb High, Isles Sink Low, WASH in PICs";
const SITE_DESCRIPTION =
  "Pacific Island Countries pollute the least yet pay the most: as seas climb, clean water and sanitation (WASH) decline. An interactive data story on sea level rise and WASH across the Pacific.";

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
    "water sanitation hygiene",
    "clean water",
    "open defecation",
    "rural urban divide",
    "emissions",
    "data visualization",
    "interactive story",
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
    siteName: "A Pacific Climate Crisis",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "A Pacific climate crisis: seas climb high, isles sink low, wash in PICs",
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