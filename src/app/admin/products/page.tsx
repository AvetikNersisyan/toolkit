import { asc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { formatAmd } from "@/lib/format";
import { uploadUrl } from "@/lib/products";
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUS_STYLE } from "../statuses";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ապրանքներ" };

export default async function ProductsAdmin() {
  const [list, images] = await Promise.all([
    db
      .select()
      .from(products)
      // archived at the bottom
      .orderBy(sql`${products.status} = 'archived'`, asc(products.sortOrder), asc(products.id)),
    db
      .select({ productId: productImages.productId, file: productImages.file })
      .from(productImages)
      .where(eq(productImages.kind, "gallery"))
      .orderBy(asc(productImages.sortOrder), asc(productImages.id)),
  ]);
  const thumb = (id: number) => images.find((i) => i.productId === id)?.file;

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Ապրանքներ</h1>
        <Link
          href="/admin/products/new"
          className="flex min-h-11 items-center rounded-lg bg-accent px-4 font-bold text-white hover:bg-accent-dark"
        >
          + Նոր ապրանք
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-line p-8 text-center text-muted">Ապրանքներ դեռ չկան։</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((p) => {
            const file = thumb(p.id);
            return (
              <article
                key={p.id}
                className={`flex flex-wrap items-center gap-4 rounded-xl border border-line p-3 ${p.status === "archived" ? "opacity-60" : ""}`}
              >
                <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg bg-placeholder">
                  {file ? <Image src={uploadUrl(file)} alt="" fill sizes="64px" className="object-contain" /> : null}
                </div>
                <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{p.name}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${PRODUCT_STATUS_STYLE[p.status]}`}>
                      {PRODUCT_STATUS_LABEL[p.status]}
                    </span>
                  </div>
                  <div className="text-sm text-muted">
                    /{p.slug} · {formatAmd(p.price)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.status === "published" ? (
                    <a
                      href={`/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center rounded-lg border border-[#8a939a] px-3 text-sm font-medium hover:bg-soft"
                    >
                      Կայքում
                    </a>
                  ) : null}
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex min-h-11 items-center rounded-lg bg-ink px-4 text-sm font-bold text-white hover:bg-ink-2"
                  >
                    Խմբագրել
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
