import type { Metadata } from "next";
import { site } from "@/data/site";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav shopName={site.shopName} />
      {children}
    </>
  );
}
