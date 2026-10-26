import "server-only";
import { site } from "@/data/site";
import { formatAmd } from "./format";

// Telegram alert for each new order. Nothing is sent until TELEGRAM_BOT_TOKEN and
// TELEGRAM_CHAT_ID are set. TELEGRAM_CHAT_ID can list several chats, comma-separated.

export type OrderAlert = {
  id: number;
  productName: string;
  qty: number;
  addonName: string | null;
  addonPrice: number;
  total: number;
  customerName: string;
  phone: string;
  utmSource?: string;
  utmCampaign?: string;
  utmContent?: string;
};

/** Plain text (no parse_mode), so whatever the customer typed can't break the formatting. */
export function orderAlertText(o: OrderAlert): string {
  const attribution = [o.utmSource, o.utmCampaign, o.utmContent].filter(Boolean).join(" · ");
  return [
    `🛒 Նոր պատվեր №${o.id}`,
    `${o.productName} × ${o.qty}`,
    o.addonName ? `+ ${o.addonName} — ${formatAmd(o.addonPrice)}` : null,
    `Ընդհանուր՝ ${formatAmd(o.total)}`,
    "",
    `👤 ${o.customerName}`,
    `📞 ${o.phone}`,
    attribution ? `📣 ${attribution}` : null,
    "",
    `${site.url}/admin`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/** Never throws: a failed alert is logged and the order stays saved. */
export async function notifyNewOrder(o: OrderAlert): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!token || chatIds.length === 0) return; // not configured yet

  const text = orderAlertText(o);
  await Promise.all(
    chatIds.map(async (chatId) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, link_preview_options: { is_disabled: true } }),
          signal: AbortSignal.timeout(5000),
        });
        // Log Telegram's reason (e.g. "chat not found"), never the URL: it contains the token.
        if (!res.ok) console.error("[telegram] failed for chat", chatId, res.status, await res.text().catch(() => ""));
      } catch (err) {
        console.error("[telegram] error for chat", chatId, err instanceof Error ? err.message : err);
      }
    }),
  );
}
