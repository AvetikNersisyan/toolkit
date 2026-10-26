"use client";

import Image from "next/image";
import { useState } from "react";
import { Placeholder } from "./Placeholder";

/** Empty `images` only happens for a draft in the admin preview (publishing requires a photo). */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-placeholder">
        {main ? (
          <Image src={main} alt={alt} fill priority={active === 0} sizes="(max-width: 860px) 100vw, 560px" className="object-contain" />
        ) : (
          <Placeholder className="h-full" label="Ապրանքի հիմնական լուսանկար" hint="Ավելացրեք ադմինում" />
        )}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Լուսանկար ${i + 1}`}
              aria-pressed={active === i}
              className={`relative aspect-square min-h-11 flex-1 overflow-hidden rounded-lg border-2 bg-placeholder ${
                active === i ? "border-ink" : "border-transparent"
              }`}
            >
              <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
