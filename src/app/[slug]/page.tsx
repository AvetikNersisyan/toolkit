import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/ProductView";
import { site } from "@/data/site";
import { formatAmd } from "@/lib/format";
import { getPublishedProduct, getRelatedProducts } from "@/lib/products";

// Nothing is pre-built: each page renders on its first visit and stays cached
// until a product is saved in the admin (which calls revalidatePath).
export function generateStaticParams() {
  return [];
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublishedProduct(slug);
  if (!p) return {};
  const image = p.images[0];
  return {
    title: `${p.name} — ${formatAmd(p.price)} | ${site.shopName}`,
    description: p.metaDescription,
    openGraph: {
      title: `${p.name} — ${formatAmd(p.price)}`,
      description: p.metaDescription,
      images: image ? [{ url: image.src, width: image.width, height: image.height }] : undefined,
      locale: "hy_AM",
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product);
  return <ProductView product={product} related={related} />;
}
