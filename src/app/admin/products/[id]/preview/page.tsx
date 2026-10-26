import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/ProductView";
import { getProductById, getRelatedProducts } from "@/lib/products";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Նախադիտում" };

// Shows the product page for any status (drafts included), behind the admin login.
export default async function PreviewProduct({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const product = await getProductById(id);
  if (!product) notFound();
  const related = await getRelatedProducts(product);
  return <ProductView product={product} related={related} preview />;
}
