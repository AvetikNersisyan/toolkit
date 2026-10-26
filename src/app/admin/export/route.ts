import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = [
  "id",
  "createdAt",
  "status",
  "customerName",
  "phone",
  "productSlug",
  "productName",
  "qty",
  "unitPrice",
  "addonName",
  "addonPrice",
  "total",
  "note",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmContent",
  "utmTerm",
] as const;

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  // Quote, and neutralise spreadsheet formula injection.
  // (a leading + or - followed by a digit is a phone number or amount, so it's left alone)
  const safe = /^[=@\t\r]|^[+-](?!\d)/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const lines = [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))];
  // BOM so Excel opens Armenian text correctly.
  return new Response("\uFEFF" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
