"use server";

import { and, asc, count, eq, inArray, max, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { IMAGE_KINDS, productImages, products, type ImageKind } from "@/db/schema";
import { removeUpload, saveImage, saveVideo, UploadError } from "@/lib/uploads";
import { requireAdmin } from "../require-admin";
import { fieldErrors, NewProductInput, ProductInput, type ActionResult, type ProductFormValues } from "./input";
import { refreshSite } from "./revalidate";

const Id = z.number().int().positive();

const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === "23505";
const slugTaken: ActionResult = { ok: false, error: "Ստուգեք նշված դաշտերը", fieldErrors: { slug: "Այս հասցեն արդեն օգտագործվում է" } };

async function galleryCount(productId: number): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(productImages)
    .where(and(eq(productImages.productId, productId), eq(productImages.kind, "gallery")));
  return n;
}

async function productExists(productId: number): Promise<boolean> {
  const [row] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  return !!row;
}

function uploadFailure(err: unknown): ActionResult {
  if (err instanceof UploadError) return { ok: false, error: err.message };
  console.error("[admin upload]", err);
  return { ok: false, error: "Չհաջողվեց պահպանել ֆայլը։" };
}

export async function createProduct(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = NewProductInput.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    price: String(formData.get("price") ?? ""),
  });
  if (!parsed.success) return { ok: false, error: "Ստուգեք նշված դաշտերը", fieldErrors: fieldErrors(parsed.error) };

  let id: number;
  try {
    [{ id }] = await db.insert(products).values(parsed.data).returning({ id: products.id });
  } catch (err) {
    if (isUniqueViolation(err)) return slugTaken;
    throw err;
  }
  redirect(`/admin/products/${id}`);
}

export async function saveProduct(productId: number, values: ProductFormValues): Promise<ActionResult> {
  await requireAdmin();
  if (!Id.safeParse(productId).success || !(await productExists(productId))) return { ok: false, error: "Ապրանքը չի գտնվել։" };

  const parsed = ProductInput.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Ստուգեք նշված դաշտերը", fieldErrors: fieldErrors(parsed.error) };
  const { youtube, relatedIds, ...data } = parsed.data;

  if (data.status === "published" && (await galleryCount(productId)) === 0) {
    return { ok: false, error: "Հրապարակելու համար ավելացրեք առնվազն մեկ լուսանկար։", fieldErrors: { status: "Լուսանկար չկա" } };
  }

  // Keep only real, other products, in the chosen order.
  const wanted = [...new Set(relatedIds)].filter((id) => id !== productId);
  const existing = wanted.length
    ? (await db.select({ id: products.id }).from(products).where(inArray(products.id, wanted))).map((r) => r.id)
    : [];

  try {
    await db
      .update(products)
      .set({ ...data, youtubeId: youtube, relatedIds: wanted.filter((id) => existing.includes(id)), updatedAt: sql`now()` })
      .where(eq(products.id, productId));
  } catch (err) {
    if (isUniqueViolation(err)) return slugTaken;
    throw err;
  }
  refreshSite();
  return { ok: true, message: "Պահպանված է" };
}

/** One file per call, so the editor can show progress and per-file errors. */
export async function uploadImage(productId: number, kind: ImageKind, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!Id.safeParse(productId).success || !IMAGE_KINDS.includes(kind) || !(await productExists(productId))) {
    return { ok: false, error: "Սխալ հարցում։" };
  }
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Ֆայլ չի ընտրվել։" };

  let saved: Awaited<ReturnType<typeof saveImage>>;
  try {
    saved = await saveImage(file);
  } catch (err) {
    return uploadFailure(err);
  }

  if (kind === "gallery") {
    const [{ last }] = await db
      .select({ last: max(productImages.sortOrder) })
      .from(productImages)
      .where(and(eq(productImages.productId, productId), eq(productImages.kind, "gallery")));
    await db.insert(productImages).values({ productId, kind, ...saved, sortOrder: (last ?? -1) + 1 });
  } else {
    // Box and poster hold one image: the new one replaces the old.
    const old = await db
      .select()
      .from(productImages)
      .where(and(eq(productImages.productId, productId), eq(productImages.kind, kind)));
    await db.insert(productImages).values({ productId, kind, ...saved });
    if (old.length) {
      await db.delete(productImages).where(inArray(productImages.id, old.map((o) => o.id)));
      await Promise.all(old.map((o) => removeUpload(o.file)));
    }
  }
  refreshSite();
  return { ok: true };
}

export async function deleteImage(imageId: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Id.safeParse(imageId).success) return { ok: false, error: "Սխալ հարցում։" };
  const [img] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!img) return { ok: true };

  if (img.kind === "gallery" && (await galleryCount(img.productId)) === 1) {
    const [p] = await db.select({ status: products.status }).from(products).where(eq(products.id, img.productId));
    if (p?.status === "published") {
      return { ok: false, error: "Հրապարակված ապրանքը պետք է ունենա առնվազն մեկ լուսանկար։ Նախ ավելացրեք նորը կամ հանեք հրապարակումից։" };
    }
  }

  await db.delete(productImages).where(eq(productImages.id, imageId));
  await removeUpload(img.file);
  refreshSite();
  return { ok: true };
}

/** Moves a gallery image one place left (-1) or right (1). The first image is the hero. */
export async function moveImage(imageId: number, direction: -1 | 1): Promise<ActionResult> {
  await requireAdmin();
  if (!Id.safeParse(imageId).success || (direction !== -1 && direction !== 1)) return { ok: false, error: "Սխալ հարցում։" };
  const [img] = await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1);
  if (!img || img.kind !== "gallery") return { ok: false, error: "Սխալ հարցում։" };

  const list = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(and(eq(productImages.productId, img.productId), eq(productImages.kind, "gallery")))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
  const from = list.findIndex((r) => r.id === imageId);
  const to = from + direction;
  if (to < 0 || to >= list.length) return { ok: true };

  const ids = list.map((r) => r.id);
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await db.transaction(async (tx) => {
    for (const [i, id] of ids.entries()) {
      await tx.update(productImages).set({ sortOrder: i }).where(eq(productImages.id, id));
    }
  });
  refreshSite();
  return { ok: true };
}

export async function uploadVideo(productId: number, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (!Id.safeParse(productId).success) return { ok: false, error: "Սխալ հարցում։" };
  const [p] = await db.select({ videoFile: products.videoFile }).from(products).where(eq(products.id, productId)).limit(1);
  if (!p) return { ok: false, error: "Ապրանքը չի գտնվել։" };
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "Ֆայլ չի ընտրվել։" };

  let name: string;
  try {
    name = await saveVideo(file);
  } catch (err) {
    return uploadFailure(err);
  }
  await db.update(products).set({ videoFile: name, updatedAt: sql`now()` }).where(eq(products.id, productId));
  await removeUpload(p.videoFile);
  refreshSite();
  return { ok: true };
}

export async function removeVideo(productId: number): Promise<ActionResult> {
  await requireAdmin();
  if (!Id.safeParse(productId).success) return { ok: false, error: "Սխալ հարցում։" };
  const [p] = await db.select({ videoFile: products.videoFile }).from(products).where(eq(products.id, productId)).limit(1);
  if (!p) return { ok: true };
  await db.update(products).set({ videoFile: null, updatedAt: sql`now()` }).where(eq(products.id, productId));
  await removeUpload(p.videoFile);
  refreshSite();
  return { ok: true };
}
