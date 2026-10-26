import type { Metadata } from "next";
import Link from "next/link";
import { NewProductForm } from "./NewProductForm";

export const metadata: Metadata = { title: "Նոր ապրանք" };

export default function NewProduct() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <Link href="/admin/products" className="text-sm text-muted hover:underline">
        ← Ապրանքներ
      </Link>
      <h1 className="mb-5 mt-2 text-2xl font-extrabold">Նոր ապրանք</h1>
      <NewProductForm />
    </main>
  );
}
