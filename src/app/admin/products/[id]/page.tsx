import { and, asc, eq, ne } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { productImages, products, type ProductImageRow } from "@/db/schema";
import { uploadUrl } from "@/lib/products";
import { MAX_IMAGE_MB, MAX_VIDEO_MB } from "@/lib/uploads";
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_STYLE } from "../../statuses";
import { toFormValues } from "../input";
import { MediaManager } from "../MediaManager";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ապրանքի խմբագրում" };

const toImg = (r: ProductImageRow) => ({ id: r.id, src: uploadUrl(r.file), width: r.width, height: r.height });

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!row) notFound();

  const [images, others] = await Promise.all([
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(asc(productImages.sortOrder), asc(productImages.id)),
    db
      .select({ id: products.id, name: products.name, status: products.status })
      .from(products)
      .where(and(ne(products.id, id), ne(products.status, "archived")))
      .orderBy(asc(products.sortOrder), asc(products.id)),
  ]);
  const box = images.find((i) => i.kind === "box");
  const poster = images.find((i) => i.kind === "poster");

  return (
    <main className="mx-auto max-w-[1000px] px-4 pt-6">
      <Link href="/admin/products" className="text-sm text-muted hover:underline">
        ← Ապրանքներ
      </Link>
      <div className="mb-5 mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{row.name}</h1>
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${PRODUCT_STATUS_STYLE[row.status]}`}>
          {PRODUCT_STATUS_LABEL[row.status]}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <a
            href={`/admin/products/${id}/preview`}
            target="_blank"
            className="flex min-h-11 items-center rounded-lg border border-[#8a939a] px-3 text-sm font-medium hover:bg-soft"
          >
            Նախադիտում
          </a>
          {row.status === "published" ? (
            <a
              href={`/${row.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center rounded-lg border border-[#8a939a] px-3 text-sm font-medium hover:bg-soft"
            >
              Կայքում
            </a>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <MediaManager
          productId={id}
          gallery={images.filter((i) => i.kind === "gallery").map(toImg)}
          box={box ? toImg(box) : undefined}
          poster={poster ? toImg(poster) : undefined}
          videoSrc={row.videoFile ? uploadUrl(row.videoFile) : undefined}
          maxImageMb={MAX_IMAGE_MB}
          maxVideoMb={MAX_VIDEO_MB}
        />
        <ProductForm productId={id} initial={toFormValues(row)} others={others} />
      </div>
    </main>
  );
}
