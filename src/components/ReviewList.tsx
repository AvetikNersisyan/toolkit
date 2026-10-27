"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatDay } from "@/lib/format";
import type { Review } from "@/lib/product-types";
import { CheckIcon } from "./Icons";
import { Stars } from "./Stars";

const INITIAL = 6;

/** Review cards: the first few, a "show all" button, and a tap-to-enlarge photo viewer. */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  const [showAll, setShowAll] = useState(false);
  const [photo, setPhoto] = useState<Review["photo"] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const shown = showAll ? reviews : reviews.slice(0, INITIAL);

  useEffect(() => {
    if (photo) dialog.current?.showModal();
  }, [photo]);

  return (
    <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {shown.map((r) => (
          <article key={r.id} className="flex flex-col gap-2.5 rounded-xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars value={r.rating} className="h-4 w-4" />
              {r.verified ? (
                <span className="flex items-center gap-1 text-xs font-bold text-ok">
                  <CheckIcon className="h-3.5 w-3.5" />
                  Հաստատված գնորդ
                </span>
              ) : null}
            </div>
            <p className="m-0 whitespace-pre-line text-ink-2">{r.text}</p>
            {r.photo ? (
              <button
                type="button"
                onClick={() => setPhoto(r.photo)}
                aria-label="Մեծացնել լուսանկարը"
                className="relative h-24 w-24 overflow-hidden rounded-lg border border-line bg-placeholder"
              >
                <Image src={r.photo.src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ) : null}
            <div className="mt-auto text-sm text-muted">
              <span className="font-bold text-ink">{r.name}</span>
              {r.city ? `, ${r.city}` : ""} · {formatDay(r.date)}
            </div>
          </article>
        ))}
      </div>

      {!showAll && reviews.length > INITIAL ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="min-h-11 w-fit rounded-lg border border-[#8a939a] bg-white px-5 font-bold hover:bg-soft"
        >
          Ցույց տալ բոլորը ({reviews.length})
        </button>
      ) : null}

      <dialog
        ref={dialog}
        onClose={() => setPhoto(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()} // tap outside the photo closes
        className="m-auto max-h-[90vh] max-w-[min(92vw,900px)] rounded-xl bg-transparent p-0 backdrop:bg-black/75"
      >
        {photo ? (
          <div className="relative">
            <Image
              src={photo.src}
              alt="Գնորդի լուսանկարը"
              width={photo.width}
              height={photo.height}
              sizes="(max-width: 960px) 92vw, 900px"
              className="h-auto max-h-[90vh] w-auto max-w-full rounded-xl"
            />
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Փակել"
              className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-2xl text-white"
            >
              ×
            </button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
