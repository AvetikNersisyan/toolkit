import { and, count, eq, gte } from "drizzle-orm";
import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getProduct } from "@/data/products";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { normalizeArmenianPhone } from "@/lib/format";
import { sendOrderEvent } from "@/lib/meta-capi";
import { calcTotal, MAX_QTY } from "@/lib/pricing";

export const runtime = "nodejs";

const opt = z.string().trim().max(300).optional();

const OrderInput = z.object({
  slug: z.string().max(100),
  qty: z.number().int().min(1).max(MAX_QTY),
  addon: z.boolean().default(false),
  name: z.string().trim().min(2).max(100),
  phone: z.string().max(40),
  website: z.string().max(200).optional(), // honeypot
  eventId: z.string().max(100).optional(),
  pageUrl: z.string().max(1000).optional(),
  utmSource: opt,
  utmMedium: opt,
  utmCampaign: opt,
  utmContent: opt,
  utmTerm: opt,
  fbclid: opt,
});

const DUPLICATE_WINDOW_MIN = 10;
const MAX_ORDERS_PER_IP_PER_10_MIN = 5;

function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: NextRequest) {
  let input: z.infer<typeof OrderInput>;
  try {
    input = OrderInput.parse(await req.json());
  } catch {
    return fail("Ստուգեք լրացված տվյալները։");
  }

  // Bots fill the hidden field; pretend success so they don't retry.
  if (input.website) return NextResponse.json({ ok: true, orderId: 0 });

  const product = getProduct(input.slug);
  if (!product) return fail("Ապրանքը չի գտնվել։", 404);

  const phone = normalizeArmenianPhone(input.phone);
  if (!phone) return fail("Գրեք ճիշտ հեռախոսահամար, օր.՝ 093 123456");

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MIN * 60_000);

  // Same phone ordering the same product again within a few minutes = double tap.
  const dup = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.phone, phone), eq(orders.productSlug, product.slug), gte(orders.createdAt, since)))
    .limit(1);
  if (dup[0]) return NextResponse.json({ ok: true, orderId: dup[0].id });

  if (ip) {
    const [{ n }] = await db
      .select({ n: count() })
      .from(orders)
      .where(and(eq(orders.ip, ip), gte(orders.createdAt, since)));
    if (n >= MAX_ORDERS_PER_IP_PER_10_MIN) return fail("Չափազանց շատ պատվերներ։ Զանգահարեք մեզ։", 429);
  }

  // Prices always come from the server-side product data, never from the browser.
  const withAddon = input.addon && !!product.addon;
  const total = calcTotal(product, input.qty, withAddon);

  const [created] = await db
    .insert(orders)
    .values({
      productSlug: product.slug,
      productName: product.name,
      qty: input.qty,
      unitPrice: product.price,
      addonName: withAddon ? product.addon!.name : null,
      addonPrice: withAddon ? product.addon!.price : 0,
      total,
      customerName: input.name,
      phone,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      utmContent: input.utmContent,
      utmTerm: input.utmTerm,
      fbclid: input.fbclid,
      eventId: input.eventId,
      pageUrl: input.pageUrl,
      ip,
      userAgent,
    })
    .returning({ id: orders.id });

  // Send the server-side Meta event after responding, so the customer never waits on it.
  if (input.eventId) {
    const fbp = req.cookies.get("_fbp")?.value;
    const fbc =
      req.cookies.get("_fbc")?.value ?? (input.fbclid ? `fb.1.${Date.now()}.${input.fbclid}` : undefined);
    after(() =>
      sendOrderEvent({
        eventId: input.eventId!,
        eventSourceUrl: input.pageUrl,
        phone,
        name: input.name,
        ip,
        userAgent,
        fbp,
        fbc,
        value: total,
        contentId: product.slug,
        qty: input.qty,
      }),
    );
  }

  return NextResponse.json({ ok: true, orderId: created.id });
}
