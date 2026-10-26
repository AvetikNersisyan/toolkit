"use client";

import Image from "next/image";
import { useState } from "react";
import { Placeholder } from "./Placeholder";

/** `images` entries are null when the file doesn't exist yet. */
export function Gallery({ images, alt }: { images: (string | null)[]; alt: string }) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-placeholder">
        {main ? (
          <Image src={main} alt={alt} fill priority={active === 0} sizes="(max-width: 860px) 100vw, 560px" className="object-contain" />
        ) : (
          <Placeholder className="h-full" label="Ապրանքի հիմնական լուսանկար" hint="1200 × 1200 · նույնը, ինչ գովազդում" />
        )}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-3">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Լուսանկար ${i + 1}`}
              aria-pressed={active === i}
              className={`relative aspect-square min-h-11 flex-1 overflow-hidden rounded-lg border-2 bg-placeholder ${
                active === i ? "border-ink" : "border-transparent"
              }`}
            >
              {src ? (
                <Image src={src} alt="" fill sizes="120px" className="object-cover" />
              ) : (
                <span className="text-xs text-muted">Լուս. {i + 1}</span>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
