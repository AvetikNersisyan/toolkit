"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { ORDER_STATUSES, orders, type OrderStatus } from "@/db/schema";

// Server actions are POSTs to /admin, so the Basic Auth middleware protects them too.

export async function updateOrder(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 1000);
  if (!Number.isInteger(id) || !ORDER_STATUSES.includes(status as OrderStatus)) return;

  await db
    .update(orders)
    .set({ status: status as OrderStatus, note: note || null, updatedAt: sql`now()` })
    .where(eq(orders.id, id));
  revalidatePath("/admin");
}
