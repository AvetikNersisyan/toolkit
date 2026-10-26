"use client";

import { useEffect, useState } from "react";
import { formatAmd } from "@/lib/format";

/** Pinned bottom bar with price + order button; hides while the order form is on screen. */
export function StickyOrderBar({ price }: { price: number }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const target = document.getElementById("order");
    if (!target || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting), { threshold: 0.15 });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-4 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] transition-transform duration-200 ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3">
        <div className="flex flex-col leading-tight">
          <span className="text-xl font-extrabold">{formatAmd(price)}</span>
          <span className="text-[13px] text-ink-2">Վճարում ստանալիս</span>
        </div>
        <a
          href="#order"
          tabIndex={hidden ? -1 : 0}
          className="flex min-h-12 items-center justify-center rounded-[10px] bg-accent px-6 font-extrabold text-white hover:bg-accent-dark"
        >
          Պատվիրել
        </a>
      </div>
    </div>
  );
}
