import { Logo } from "@/components/Logo";
import { ProductCard } from "@/components/ProductView";
import { listPublishedProducts } from "@/lib/products";

// Rendered per request so the build never needs the database. Ads link straight to /<slug>.
export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listPublishedProducts();
  return (
    <main className="mx-auto max-w-[1120px] px-4 py-10">
      <h1 className="mb-6">
        <Logo on="light" priority className="h-10" />
      </h1>
      <div className="flex flex-wrap gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
