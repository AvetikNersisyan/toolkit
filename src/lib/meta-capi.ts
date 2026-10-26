import "server-only";
import { createHash } from "node:crypto";

// Meta Conversions API: sends the order event from the server so it is counted
// even when the browser pixel is blocked. Uses the same event_id as the browser
// event so Meta de-duplicates the two.

const sha256 = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export type CapiOrderEvent = {
  eventId: string;
  eventSourceUrl?: string;
  phone: string; // +374XXXXXXXX
  name: string;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  value: number;
  contentId: string;
  qty: number;
};

export async function sendOrderEvent(e: CapiOrderEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return; // not configured yet

  const version = process.env.META_GRAPH_API_VERSION || "v23.0";
  const eventName = process.env.NEXT_PUBLIC_META_ORDER_EVENT || "Purchase";
  const firstName = e.name.split(/\s+/)[0] ?? "";

  const body = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        action_source: "website",
        event_source_url: e.eventSourceUrl,
        user_data: {
          ph: [sha256(e.phone.replace(/\D/g, ""))],
          fn: firstName ? [sha256(firstName)] : undefined,
          country: [sha256("am")],
          client_ip_address: e.ip,
          client_user_agent: e.userAgent,
          fbp: e.fbp,
          fbc: e.fbc,
        },
        custom_data: {
          currency: "AMD",
          value: e.value,
          content_ids: [e.contentId],
          content_type: "product",
          num_items: e.qty,
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${version}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
    if (!res.ok) console.error("[meta-capi] failed", res.status, await res.text().catch(() => ""));
  } catch (err) {
    console.error("[meta-capi] error", err);
  } finally {
    clearTimeout(timer);
  }
}
