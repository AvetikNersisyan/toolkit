// Browser-side tracking helpers: Meta Pixel calls and ad attribution (UTM / fbclid).

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
/** "Purchase" (default) or "Lead" — must match on the server (same env var). */
export const ORDER_EVENT = process.env.NEXT_PUBLIC_META_ORDER_EVENT || "Purchase";

export function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (eventId) window.fbq("track", event, params ?? {}, { eventID: eventId });
  else window.fbq("track", event, params ?? {});
}

export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  fbclid?: string;
};

const STORAGE_KEY = "attribution";

/** Saves UTM params / fbclid from the current URL for this browser session. */
export function captureAttribution() {
  try {
    const p = new URLSearchParams(window.location.search);
    const fresh: Attribution = {
      utmSource: p.get("utm_source") ?? undefined,
      utmMedium: p.get("utm_medium") ?? undefined,
      utmCampaign: p.get("utm_campaign") ?? undefined,
      utmContent: p.get("utm_content") ?? undefined,
      utmTerm: p.get("utm_term") ?? undefined,
      fbclid: p.get("fbclid") ?? undefined,
    };
    // Only overwrite when the visitor arrived from a new tagged link.
    if (Object.values(fresh).some(Boolean)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
  } catch {
    // storage unavailable (private mode etc.) — attribution is best-effort
  }
}

export function readAttribution(): Attribution {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as Attribution;
  } catch {
    return {};
  }
}

export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
