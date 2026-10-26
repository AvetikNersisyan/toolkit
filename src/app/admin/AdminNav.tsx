"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Պատվերներ", match: (p: string) => p === "/admin" },
  { href: "/admin/products", label: "Ապրանքներ", match: (p: string) => p.startsWith("/admin/products") },
];

export function AdminNav({ shopName }: { shopName: string }) {
  const pathname = usePathname();
  return (
    <nav className="border-b border-line bg-soft px-4" aria-label="Ադմին">
      <div className="mx-auto flex min-h-14 max-w-[1200px] flex-wrap items-center gap-x-2 gap-y-1">
        <span className="mr-3 font-extrabold">{shopName}</span>
        {LINKS.map((l) => {
          const active = l.match(pathname);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-bold ${active ? "bg-ink text-white" : "hover:bg-white"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
