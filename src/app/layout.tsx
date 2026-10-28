import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { MetaPixel } from "@/components/MetaPixel";
import { site } from "@/data/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.shopName} | ${site.tagline}`,
  description: "Գործիքներ՝ վճարում ստանալիս, առաքում ամբողջ Հայաստանում։",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c1f22",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hy">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Armenian:wght@400;500;700;800&display=swap"
        />
      </head>
      <body>
        {children}
        <MetaPixel />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
