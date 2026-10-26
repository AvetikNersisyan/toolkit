import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// draft: only visible in the admin preview · published: live at /<slug> · archived: hidden, kept for old orders
export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

// gallery: ordered, the first one is the hero · box: "what's in the box" · poster: video cover
export const IMAGE_KINDS = ["gallery", "box", "poster"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

export type Benefit = { value: string; title: string; text: string };
export type Spec = { label: string; value: string };
export type Faq = { q: string; a: string };

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").$type<ProductStatus>().notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),

    /** The URL is /<slug>. */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull().default(""),
    brand: text("brand").notNull().default(""),

    // Prices in AMD
    price: integer("price").notNull(),
    oldPrice: integer("old_price"),
    /** Real end of the current offer. Null hides the countdown. */
    offerEnd: timestamp("offer_end", { withTimezone: true }),
    gift: text("gift"),
    stockNote: text("stock_note"),

    subheadline: text("subheadline").notNull().default(""),
    highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
    benefits: jsonb("benefits").$type<Benefit[]>().notNull().default([]),
    specs: jsonb("specs").$type<Spec[]>().notNull().default([]),
    inTheBox: jsonb("in_the_box").$type<string[]>().notNull().default([]),
    faq: jsonb("faq").$type<Faq[]>().notNull().default([]),

    // Optional upsell; no addon when addon_name is null
    addonName: text("addon_name"),
    addonPrice: integer("addon_price"),
    addonNote: text("addon_note"),

    // Video: an uploaded mp4 wins over a YouTube id
    youtubeId: text("youtube_id"),
    videoFile: text("video_file"),

    /** Product ids shown at the bottom, in this order. Missing/unpublished ids are skipped. */
    relatedIds: integer("related_ids").array().notNull().default(sql`'{}'::integer[]`),
    metaDescription: text("meta_description").notNull().default(""),
  },
  (t) => [uniqueIndex("products_slug_idx").on(t.slug), index("products_status_idx").on(t.status)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ImageKind>().notNull(),
    /** File name inside UPLOAD_DIR, served at /uploads/<file>. */
    file: text("file").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId, t.kind, t.sortOrder)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").$type<OrderStatus>().notNull().default("new"),

    // What was ordered (name and prices are copied at order time, in AMD)
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    productSlug: text("product_slug").notNull(),
    productName: text("product_name").notNull(),
    qty: integer("qty").notNull(),
    unitPrice: integer("unit_price").notNull(),
    addonName: text("addon_name"),
    addonPrice: integer("addon_price").notNull().default(0),
    total: integer("total").notNull(),

    // Customer
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    note: text("note"),

    // Attribution
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    fbclid: text("fbclid"),
    eventId: text("event_id"),
    pageUrl: text("page_url"),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [
    index("orders_created_at_idx").on(t.createdAt),
    index("orders_phone_idx").on(t.phone),
    index("orders_status_idx").on(t.status),
    index("orders_product_id_idx").on(t.productId),
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type ProductRow = typeof products.$inferSelect;
export type ProductImageRow = typeof productImages.$inferSelect;
