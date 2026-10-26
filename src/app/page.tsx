import { ProductCard } from "@/components/ProductView";
import { site } from "@/data/site";
import { listPublishedProducts } from "@/lib/products";

// Rendered per request so the build never needs the database. Ads link straight to /<slug>.
export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listPublishedProducts();
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-10">
      <h1 className="mb-6 text-3xl font-extrabold">{site.shopName}</h1>
      <div className="flex flex-wrap gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
