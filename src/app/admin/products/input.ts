import { z } from "zod";
import { PRODUCT_STATUSES, type Benefit, type Faq, type ProductRow, type ProductStatus, type Spec } from "@/db/schema";

// Form model for the product editor, and the validation that turns it into database values.

/** Everything as the editor holds it: numbers and dates stay strings until validated. */
export type ProductFormValues = {
  status: ProductStatus;
  slug: string;
  name: string;
  shortName: string;
  brand: string;
  price: string;
  oldPrice: string;
  /** "YYYY-MM-DDTHH:mm" in Yerevan time, or "". */
  offerEnd: string;
  gift: string;
  stockNote: string;
  subheadline: string;
  highlights: string[];
  benefits: Benefit[];
  specs: Spec[];
  inTheBox: string[];
  faq: Faq[];
  addonName: string;
  addonPrice: string;
  addonNote: string;
  /** YouTube id or link. */
  youtube: string;
  relatedIds: number[];
  metaDescription: string;
  sortOrder: string;
};

export type FieldErrors = Partial<Record<keyof ProductFormValues, string>>;

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: FieldErrors };

// Armenia has no daylight saving time.
const YEREVAN_OFFSET_MS = 4 * 60 * 60 * 1000;

export function toYerevanInput(d: Date | null): string {
  return d ? new Date(d.getTime() + YEREVAN_OFFSET_MS).toISOString().slice(0, 16) : "";
}

/** Top-level paths that already belong to the site, so they can't be product URLs. */
const RESERVED_SLUGS = ["admin", "api", "uploads", "_next", "favicon.ico"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 11-char id from an id or any common YouTube link; null when empty, undefined when unrecognised. */
export function parseYoutubeId(v: string): string | null | undefined {
  if (!v) return null;
  if (/^[\w-]{11}$/.test(v)) return v;
  let id: string | null | undefined;
  try {
    const u = new URL(v);
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    else if (/(^|\.)youtube(-nocookie)?\.com$/.test(u.hostname))
      id = u.searchParams.get("v") ?? u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1];
  } catch {
    return undefined;
  }
  return id && /^[\w-]{11}$/.test(id) ? id : undefined;
}

const text = (max: number) => z.string().trim().max(max, `Առավելագույնը ${max} նիշ`);
const optText = (max: number) => text(max).transform((v) => v || null);
function parseAmd(v: string, ctx: z.RefinementCtx): number {
  if (!/^\d{1,9}$/.test(v) || Number(v) <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Գրեք դրամով՝ 0-ից մեծ ամբողջ թիվ" });
    return z.NEVER;
  }
  return Number(v);
}
const money = z.string().trim().transform(parseAmd);
const optMoney = z
  .string()
  .trim()
  .transform((v, ctx) => (v ? parseAmd(v, ctx) : null));
/** Drops rows the admin left completely empty. */
const lines = (max: number, maxRows: number) =>
  z
    .array(text(max))
    .max(maxRows, `Առավելագույնը ${maxRows} տող`)
    .transform((a) => a.filter(Boolean));

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(SLUG_RE, "Միայն լատինատառ փոքրատառեր, թվեր և գծիկ, օր.՝ hammer-drill")
  .max(80)
  .refine((s) => !RESERVED_SLUGS.includes(s), "Այս հասցեն զբաղված է կայքի կողմից");

export const NewProductInput = z.object({
  name: text(200).min(2, "Գրեք անունը"),
  slug: slugSchema,
  price: money,
});

export const ProductInput = z
  .object({
    status: z.enum(PRODUCT_STATUSES),
    slug: slugSchema,
    name: text(200).min(2, "Գրեք անունը"),
    shortName: text(100),
    brand: text(100),
    price: money,
    oldPrice: optMoney,
    offerEnd: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), "Սխալ ամսաթիվ")
      .transform((v) => (v ? new Date(`${v}:00+04:00`) : null)),
    gift: optText(200),
    stockNote: optText(200),
    subheadline: text(600),
    highlights: lines(200, 12),
    benefits: z
      .array(z.object({ value: text(40), title: text(120), text: text(400) }))
      .max(12)
      .transform((a) => a.filter((b) => b.value || b.title || b.text))
      .refine((a) => a.every((b) => b.title), "Յուրաքանչյուր առավելություն պետք է ունենա վերնագիր"),
    specs: z
      .array(z.object({ label: text(100), value: text(200) }))
      .max(40)
      .transform((a) => a.filter((s) => s.label || s.value))
      .refine((a) => a.every((s) => s.label && s.value), "Լրացրեք բոլոր տողերի անունն ու արժեքը"),
    inTheBox: lines(200, 30),
    faq: z
      .array(z.object({ q: text(300), a: text(2000) }))
      .max(20)
      .transform((a) => a.filter((f) => f.q || f.a))
      .refine((a) => a.every((f) => f.q && f.a), "Լրացրեք բոլոր հարցերն ու պատասխանները"),
    addonName: optText(200),
    addonPrice: optMoney,
    addonNote: optText(200),
    youtube: z
      .string()
      .trim()
      .transform(parseYoutubeId)
      .refine((v) => v !== undefined, "Չհաջողվեց ճանաչել YouTube հղումը"),
    relatedIds: z.array(z.number().int().positive()).max(12),
    metaDescription: text(300),
    sortOrder: z
      .string()
      .trim()
      .regex(/^-?\d{0,6}$/, "Ամբողջ թիվ")
      .transform((v) => Number(v) || 0),
  })
  .refine((v) => !v.addonName || v.addonPrice != null, { path: ["addonPrice"], message: "Նշեք լրացուցիչ ապրանքի գինը" })
  .refine((v) => v.oldPrice == null || v.oldPrice > v.price, { path: ["oldPrice"], message: "Հին գինը պետք է մեծ լինի նոր գնից" });

export type ProductData = z.output<typeof ProductInput>;

export function toFormValues(row: ProductRow): ProductFormValues {
  return {
    status: row.status,
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    brand: row.brand,
    price: String(row.price),
    oldPrice: row.oldPrice == null ? "" : String(row.oldPrice),
    offerEnd: toYerevanInput(row.offerEnd),
    gift: row.gift ?? "",
    stockNote: row.stockNote ?? "",
    subheadline: row.subheadline,
    highlights: row.highlights,
    benefits: row.benefits,
    specs: row.specs,
    inTheBox: row.inTheBox,
    faq: row.faq,
    addonName: row.addonName ?? "",
    addonPrice: row.addonPrice == null ? "" : String(row.addonPrice),
    addonNote: row.addonNote ?? "",
    youtube: row.youtubeId ?? "",
    relatedIds: row.relatedIds,
    metaDescription: row.metaDescription,
    sortOrder: String(row.sortOrder),
  };
}

/** First message per top-level field, for showing next to that field or section. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof ProductFormValues | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
