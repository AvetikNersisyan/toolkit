import Image from "next/image";
import Link from "next/link";
import { products } from "@/data/products";
import { site } from "@/data/site";
import { existing } from "@/lib/assets";
import { formatAmd } from "@/lib/format";

// Simple index of all product pages. Ads should link straight to /<slug>.
export default function Home() {
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-10">
      <h1 className="mb-6 text-3xl font-extrabold">{site.shopName}</h1>
      <div className="flex flex-wrap gap-4">
        {products.map((p) => {
          const img = existing(p.images[0]);
          return (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              className="flex max-w-[360px] flex-[1_1_240px] flex-col gap-2.5 rounded-xl border border-line p-4 hover:border-ink"
            >
              <div className="relative aspect-square overflow-hidden rounded-lg bg-placeholder">
                {img ? (
                  <Image src={img} alt={p.name} fill sizes="300px" className="object-contain" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">Լուսանկար</div>
                )}
              </div>
              <div className="font-bold">{p.name}</div>
              <div className="font-extrabold">{formatAmd(p.price)}</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
