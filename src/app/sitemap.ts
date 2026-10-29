import { asc, eq } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/db";
import { products } from "@/db/schema";
import { site } from "@/data/site";

// Built per request so the build never needs the database; lists only published products.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await db
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .where(eq(products.status, "published"))
    .orderBy(asc(products.sortOrder), asc(products.id));

  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    ...rows.map((p) => ({
      url: `${site.url}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
