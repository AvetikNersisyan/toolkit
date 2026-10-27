"use server";

import { and, asc, desc, eq, min, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders, products, reviews } from "@/db/schema";
import { removeUpload, saveImage, UploadError } from "@/lib/uploads";
import { requireAdmin } from "../require-admin";
import { fieldErrors, ReviewInput, type ReviewFieldErrors, type ReviewResult } from "./input";
import { refreshSite } from "./revalidate";

const Id = z.number().int().positive();
const invalid: ReviewResult = { ok: false, error: "Սխալ հարցում։" };
const checkFields = (fe: ReviewFieldErrors): ReviewResult => ({ ok: false, error: "Ստուգեք նշված դաշտերը", fieldErrors: fe });
const orderTaken = checkFields({ orderId: "Այս պատվերն արդեն կապված է մեկ այլ կարծիքի" });
const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === "23505";

/** Creates (reviewId null) or updates a review. FormData, because it may carry a photo. */
export async function saveReview(productId: number, reviewId: number | null, formData: FormData): Promise<ReviewResult> {
  await requireAdmin();
  if (!Id.safeParse(productId).success || (reviewId !== null && !Id.safeParse(reviewId).success)) return invalid;
  const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return invalid;

  const existing =
    reviewId === null
      ? undefined
      : (await db.select().from(reviews).where(and(eq(reviews.id, reviewId), eq(reviews.productId, productId))).limit(1))[0];
  if (reviewId !== null && !existing) return { ok: false, error: "Կարծիքը չի գտնվել։" };

  const str = (key: string) => String(formData.get(key) ?? "");
  const parsed = ReviewInput.safeParse({
    name: str("name"),
    city: str("city"),
    rating: str("rating"),
    text: str("text"),
    date: str("date"),
    orderId: str("orderId"),
    visible: formData.get("visible") === "1",
  });
  if (!parsed.success) return checkFields(fieldErrors<keyof ReviewFieldErrors>(parsed.error));
  const { date, ...data } = parsed.data;

  // The "verified buyer" badge must mean something: a real order of this product, backing one review only.
  if (data.orderId !== null) {
    const [order] = await db.select({ productId: orders.productId }).from(orders).where(eq(orders.id, data.orderId)).limit(1);
    if (!order || order.productId !== productId) return checkFields({ orderId: "Այս ապրանքի նման պատվեր չկա" });
    const [taken] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(reviewId === null ? eq(reviews.orderId, data.orderId) : and(eq(reviews.orderId, data.orderId), ne(reviews.id, reviewId)))
      .limit(1);
    if (taken) return orderTaken;
  }

  // Photo last, after every check, so a rejected review never leaves a file behind.
  const file = formData.get("photo");
  let photo: { photoFile: string | null; photoWidth: number | null; photoHeight: number | null } | undefined;
  if (file instanceof File && file.size > 0) {
    try {
      const saved = await saveImage(file);
      photo = { photoFile: saved.file, photoWidth: saved.width, photoHeight: saved.height };
    } catch (err) {
      if (err instanceof UploadError) return checkFields({ photo: err.message });
      throw err;
    }
  } else if (formData.get("removePhoto") === "1") {
    photo = { photoFile: null, photoWidth: null, photoHeight: null };
  }

  const values = { ...data, reviewDate: date, ...photo };
  try {
    if (existing) {
      await db
        .update(reviews)
        .set({ ...values, updatedAt: sql`now()` })
        .where(eq(reviews.id, existing.id));
      if (photo) await removeUpload(existing.photoFile);
    } else {
      // New reviews go to the top.
      const [{ first }] = await db.select({ first: min(reviews.sortOrder) }).from(reviews).where(eq(reviews.productId, productId));
      await db.insert(reviews).values({ productId, ...values, sortOrder: (first ?? 1) - 1 });
    }
  } catch (err) {
    if (photo?.photoFile) await removeUpload(photo.photoFile);
    if (isUniqueViolation(err)) return orderTaken; // two saves raced for the same order
    throw err;
  }
  refreshSite();
  return { ok: true };
}

export async function deleteReview(reviewId: number): Promise<ReviewResult> {
  await requireAdmin();
  if (!Id.safeParse(reviewId).success) return invalid;
  const [row] = await db.select({ photoFile: reviews.photoFile }).from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!row) return { ok: true };
  await db.delete(reviews).where(eq(reviews.id, reviewId));
  await removeUpload(row.photoFile);
  refreshSite();
  return { ok: true };
}

export async function setReviewVisible(reviewId: number, visible: boolean): Promise<ReviewResult> {
  await requireAdmin();
  if (!Id.safeParse(reviewId).success || typeof visible !== "boolean") return invalid;
  await db.update(reviews).set({ visible, updatedAt: sql`now()` }).where(eq(reviews.id, reviewId));
  refreshSite();
  return { ok: true };
}

/** Moves a review one place up (-1) or down (1) in its product's list. */
export async function moveReview(reviewId: number, direction: -1 | 1): Promise<ReviewResult> {
  await requireAdmin();
  if (!Id.safeParse(reviewId).success || (direction !== -1 && direction !== 1)) return invalid;
  const [row] = await db.select({ productId: reviews.productId }).from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!row) return invalid;

  const ids = (
    await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.productId, row.productId))
      .orderBy(asc(reviews.sortOrder), desc(reviews.id))
  ).map((r) => r.id);
  const from = ids.indexOf(reviewId);
  const to = from + direction;
  if (to < 0 || to >= ids.length) return { ok: true };

  [ids[from], ids[to]] = [ids[to], ids[from]];
  await db.transaction(async (tx) => {
    for (const [i, id] of ids.entries()) {
      await tx.update(reviews).set({ sortOrder: i }).where(eq(reviews.id, id));
    }
  });
  refreshSite();
  return { ok: true };
}
