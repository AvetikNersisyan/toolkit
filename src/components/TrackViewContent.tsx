"use client";

import { useEffect } from "react";
import { track } from "@/lib/tracking";

export function TrackViewContent({ contentId, name, price }: { contentId: string; name: string; price: number }) {
  useEffect(() => {
    // The pixel script loads after hydration; wait briefly for fbq to exist.
    let tries = 0;
    const t = setInterval(() => {
      if (window.fbq || ++tries > 20) {
        clearInterval(t);
        track("ViewContent", { content_ids: [contentId], content_name: name, content_type: "product", value: price, currency: "AMD" });
      }
    }, 250);
    return () => clearInterval(t);
  }, [contentId, name, price]);
  return null;
}
