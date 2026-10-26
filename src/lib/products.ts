import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { productImages, products, type ProductImageRow, type ProductRow } from "@/db/schema";
import type { Product, ProductImage } from "./product-types";

export const uploadUrl = (file: string) => `/uploads/${file}`;

function toImage(r: ProductImageRow): ProductImage {
  return { id: r.id, src: uploadUrl(r.file), width: r.width, height: r.height };
}

function toProduct(row: ProductRow, imgs: ProductImageRow[]): Product {
  const box = imgs.find((i) => i.kind === "box");
  const poster = imgs.find((i) => i.kind === "poster");
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    name: row.name,
    shortName: row.shortName,
    brand: row.brand,
    price: row.price,
    oldPrice: row.oldPrice ?? undefined,
    offerEnd: row.offerEnd?.toISOString(),
    gift: row.gift ?? undefined,
    stockNote: row.stockNote ?? undefined,
    subheadline: row.subheadline,
    highlights: row.highlights,
    benefits: row.benefits,
    specs: row.specs,
    inTheBox: row.inTheBox,
    faq: row.faq,
    images: imgs.filter((i) => i.kind === "gallery").map(toImage),
    boxImage: box ? toImage(box) : undefined,
    video: row.videoFile
      ? { type: "mp4", src: uploadUrl(row.videoFile), poster: poster ? uploadUrl(poster.file) : undefined }
      : row.youtubeId
        ? { type: "youtube", id: row.youtubeId }
        : undefined,
    addon:
      row.addonName && row.addonPrice != null
        ? { name: row.addonName, price: row.addonPrice, note: row.addonNote ?? undefined }
        : undefined,
    relatedIds: row.relatedIds,
    metaDescription: row.metaDescription,
  };
}

async function withImages(rows: ProductRow[]): Promise<Product[]> {
  if (rows.length === 0) return [];
  const imgs = await db
    .select()
    .from(productImages)
    .where(
      inArray(
        productImages.productId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
  return rows.map((r) => toProduct(r, imgs.filter((i) => i.productId === r.id)));
}

/** Live product for /<slug>. Cached per request, so metadata and the page share one query. */
export const getPublishedProduct = cache(async (slug: string): Promise<Product | undefined> => {
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.status, "published")))
    .limit(1);
  return (await withImages(rows))[0];
});

/** Any status unless `publishedOnly` (the order API only sells published products). */
export async function getProductById(id: number, { publishedOnly = false } = {}): Promise<Product | undefined> {
  const rows = await db
    .select()
    .from(products)
    .where(publishedOnly ? and(eq(products.id, id), eq(products.status, "published")) : eq(products.id, id))
    .limit(1);
  return (await withImages(rows))[0];
}

export async function listPublishedProducts(): Promise<Product[]> {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.status, "published"))
    .orderBy(asc(products.sortOrder), asc(products.id));
  return withImages(rows);
}

/** Published products from `relatedIds`, in that order; deleted or hidden ones are skipped. */
export async function getRelatedProducts(product: Product): Promise<Product[]> {
  const ids = product.relatedIds.filter((id) => id !== product.id);
  if (ids.length === 0) return [];
  const rows = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.status, "published")));
  const list = await withImages(rows);
  return ids.map((id) => list.find((p) => p.id === id)).filter((p) => p !== undefined);
}
