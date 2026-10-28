"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { GA_ID } from "@/lib/tracking";

/**
 * Google Analytics 4 (gtag.js). Loads only when NEXT_PUBLIC_GA_ID is set, and not in the admin.
 * Page views (including client-side navigation), scrolls and outbound clicks come from GA4's
 * enhanced measurement, which is on by default for a web data stream.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  if (!GA_ID || pathname.startsWith("/admin")) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
