import { index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    status: text("status").$type<OrderStatus>().notNull().default("new"),

    // What was ordered (prices are copied at order time, in AMD)
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
  ],
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
