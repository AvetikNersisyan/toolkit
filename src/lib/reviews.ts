import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import type { ProductReviews, Review, ReviewSummary } from "./product-types";
import { uploadUrl } from "./products";

/** What the product page shows: visible reviews only, and a summary computed from those. */
export async function getProductReviews(productId: number): Promise<ProductReviews> {
  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.visible, true)))
    .orderBy(asc(reviews.sortOrder), desc(reviews.id));

  const list: Review[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    city: r.city ?? undefined,
    rating: r.rating,
    text: r.text,
    date: r.reviewDate,
    photo:
      r.photoFile && r.photoWidth && r.photoHeight
        ? { src: uploadUrl(r.photoFile), width: r.photoWidth, height: r.photoHeight }
        : undefined,
    verified: r.orderId != null,
  }));

  if (list.length === 0) return { list, summary: null };
  const counts: ReviewSummary["counts"] = [0, 0, 0, 0, 0];
  for (const r of list) counts[r.rating - 1]++;
  const average = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
  return { list, summary: { average: Math.round(average * 10) / 10, count: list.length, counts } };
}
