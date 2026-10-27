"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { StarIcon } from "@/components/Icons";
import { STAR_OFF, STAR_ON, Stars } from "@/components/Stars";
import { formatDay } from "@/lib/format";
import { Field, IMAGE_ACCEPT, inputClass, Section, smallButton } from "./fields";
import type { ReviewResult } from "./input";
import { deleteReview, moveReview, saveReview, setReviewVisible } from "./review-actions";

export type AdminReview = {
  id: number;
  name: string;
  city: string;
  rating: number;
  text: string;
  /** "YYYY-MM-DD" */
  date: string;
  visible: boolean;
  orderId: number | null;
  photo: { src: string; width: number; height: number } | null;
};

/** One of this product's orders, for the "linked order" picker. */
export type OrderOption = { id: number; customerName: string; label: string; reviewId: number | null };

type Shared = { productId: number; orders: OrderOption[]; today: string; maxImageMb: number };

function ReviewForm({ productId, orders, today, maxImageMb, initial, onDone }: Shared & { initial?: AdminReview; onDone: () => void }) {
  const [v, setV] = useState({
    name: initial?.name ?? "",
    city: initial?.city ?? "",
    rating: initial?.rating ?? 5,
    text: initial?.text ?? "",
    date: initial?.date ?? today,
    orderId: initial?.orderId ? String(initial.orderId) : "",
    visible: initial?.visible ?? true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const showStoredPhoto = initial?.photo && !removePhoto && !file;

  // Free orders, plus the one this review already uses.
  const choices = orders.filter((o) => o.reviewId === null || o.reviewId === initial?.id);

  function pickOrder(id: string) {
    const o = orders.find((x) => String(x.id) === id);
    // Fill an empty name with the buyer's first name; the admin can still edit it.
    setV((prev) => ({ ...prev, orderId: id, name: prev.name || (o?.customerName.split(/\s+/)[0] ?? "") }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (file && file.size > maxImageMb * 1024 * 1024) {
      setResult({ ok: false, error: "Ստուգեք նշված դաշտերը", fieldErrors: { photo: `Լուսանկարը ${maxImageMb} ՄԲ-ից մեծ է։` } });
      return;
    }
    const fd = new FormData();
    fd.set("name", v.name);
    fd.set("city", v.city);
    fd.set("rating", String(v.rating));
    fd.set("text", v.text);
    fd.set("date", v.date);
    fd.set("orderId", v.orderId);
    fd.set("visible", v.visible ? "1" : "0");
    if (file) fd.set("photo", file);
    else if (removePhoto) fd.set("removePhoto", "1");
    startTransition(async () => {
      try {
        const r = await saveReview(productId, initial?.id ?? null, fd);
        setResult(r);
        if (r.ok) onDone();
      } catch {
        setResult({ ok: false, error: "Չհաջողվեց պահպանել։ Ստուգեք կապը և փորձեք կրկին։" });
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-lg border-2 border-ink bg-white p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Անուն" hint="օր.՝ Արամ Ս." error={errors.name}>
          <input className={inputClass} value={v.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Քաղաք" hint="Ըստ ցանկության" error={errors.city}>
          <input className={inputClass} value={v.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[15px] font-medium">Գնահատական</span>
        <div role="radiogroup" aria-label="Գնահատական" className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={v.rating === n}
              aria-label={`${n} աստղ`}
              onClick={() => set("rating", n)}
              className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-soft"
            >
              <StarIcon className={`h-8 w-8 ${n <= v.rating ? STAR_ON : STAR_OFF}`} />
            </button>
          ))}
        </div>
        {errors.rating ? <span className="text-sm text-sale">{errors.rating}</span> : null}
      </div>

      <Field label="Կարծիք" error={errors.text}>
        <textarea rows={4} className={`${inputClass} py-2`} value={v.text} onChange={(e) => set("text", e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ամսաթիվ" error={errors.date}>
          <input type="date" max={today} className={inputClass} value={v.date} onChange={(e) => set("date", e.target.value)} />
        </Field>
        <Field label="Կապված պատվեր" hint="Կայքում ցույց է տալիս «Հաստատված գնորդ»" error={errors.orderId}>
          <select className={inputClass} value={v.orderId} onChange={(e) => pickOrder(e.target.value)}>
            <option value="">— Առանց պատվերի —</option>
            {choices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[15px] font-medium">Գնորդի լուսանկար</span>
        <span className="text-xs text-muted">Ըստ ցանկության · պահվում է WebP ձևաչափով, չի կտրվում</span>
        {showStoredPhoto ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-line bg-placeholder">
            <Image src={initial.photo!.src} alt="" fill sizes="96px" className="object-cover" />
          </div>
        ) : null}
        {file ? <span className="text-sm">{file.name}</span> : null}
        {removePhoto && !file ? <span className="text-sm text-muted">Լուսանկարը կհեռացվի պահպանելիս</span> : null}
        <div className="flex flex-wrap gap-2">
          <label className={`${smallButton} min-h-11 w-fit cursor-pointer px-3`}>
            {showStoredPhoto || file ? "Փոխարինել" : "+ Ավելացնել լուսանկար"}
            <input
              type="file"
              className="sr-only"
              accept={IMAGE_ACCEPT}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setRemovePhoto(false);
                e.target.value = "";
              }}
            />
          </label>
          {showStoredPhoto || file ? (
            <button
              type="button"
              className={`${smallButton} min-h-11 px-3`}
              onClick={() => {
                setFile(null);
                if (initial?.photo) setRemovePhoto(true);
              }}
            >
              Հեռացնել
            </button>
          ) : null}
        </div>
        {errors.photo ? <span className="text-sm text-sale">{errors.photo}</span> : null}
      </div>

      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-ink" checked={v.visible} onChange={(e) => set("visible", e.target.checked)} />
        <span>Ցուցադրել կայքում</span>
      </label>

      {result && !result.ok ? (
        <p className="text-sm font-medium text-sale" role="alert">
          {result.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-accent px-5 font-extrabold text-white hover:bg-accent-dark disabled:opacity-70"
        >
          {pending ? "Պահպանվում է…" : "Պահպանել կարծիքը"}
        </button>
        <button type="button" onClick={onDone} className="min-h-11 rounded-lg border border-[#8a939a] px-4 hover:bg-soft">
          Չեղարկել
        </button>
      </div>
    </form>
  );
}

export function ReviewsManager({ reviews, ...shared }: Shared & { reviews: AdminReview[] }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orderLabel = (id: number) => shared.orders.find((o) => o.id === id)?.label ?? `№${id}`;

  async function run(fn: () => Promise<ReviewResult>) {
    setBusy(true);
    setError(null);
    try {
      const r = await fn();
      if (!r.ok) setError(r.error);
    } catch {
      setError("Կապի խնդիր։ Փորձեք կրկին։");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Կարծիքներ" hint="Էջում ցուցադրվում են այս հերթականությամբ · միջինը հաշվվում է միայն տեսանելի կարծիքներից">
      {error ? (
        <p className="text-sm font-medium text-sale" role="alert">
          {error}
        </p>
      ) : null}

      {editing === "new" ? (
        <ReviewForm {...shared} onDone={() => setEditing(null)} />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex min-h-11 w-fit items-center rounded-lg bg-ink px-4 text-sm font-bold text-white hover:bg-ink-2"
        >
          + Նոր կարծիք
        </button>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted">Կարծիքներ դեռ չկան։</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r, i) =>
            editing === r.id ? (
              <li key={r.id}>
                <ReviewForm {...shared} initial={r} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={r.id} className={`flex flex-wrap gap-3 rounded-lg border border-line p-3 ${r.visible ? "" : "opacity-60"}`}>
                {r.photo ? (
                  <div className="relative h-16 w-16 flex-none overflow-hidden rounded-lg bg-placeholder">
                    <Image src={r.photo.src} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ) : null}
                <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Stars value={r.rating} className="h-4 w-4" />
                    <span className="font-bold">{r.name}</span>
                    {r.city ? <span className="text-sm text-muted">{r.city}</span> : null}
                    <span className="text-sm text-muted">{formatDay(r.date)}</span>
                    {!r.visible ? <span className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-xs font-bold">Թաքցված</span> : null}
                    {r.orderId ? <span className="text-xs font-bold text-ok">✓ {orderLabel(r.orderId)}</span> : null}
                  </div>
                  <p className="m-0 line-clamp-2 text-sm text-ink-2">{r.text}</p>
                </div>
                <div className="flex flex-wrap items-start gap-1">
                  <button type="button" className={smallButton} disabled={busy || i === 0} onClick={() => run(() => moveReview(r.id, -1))} aria-label="Վեր">
                    ↑
                  </button>
                  <button
                    type="button"
                    className={smallButton}
                    disabled={busy || i === reviews.length - 1}
                    onClick={() => run(() => moveReview(r.id, 1))}
                    aria-label="Վար"
                  >
                    ↓
                  </button>
                  <button type="button" className={smallButton} disabled={busy} onClick={() => run(() => setReviewVisible(r.id, !r.visible))}>
                    {r.visible ? "Թաքցնել" : "Ցուցադրել"}
                  </button>
                  <button type="button" className={smallButton} disabled={busy || editing !== null} onClick={() => setEditing(r.id)}>
                    Խմբագրել
                  </button>
                  <button
                    type="button"
                    className={smallButton}
                    disabled={busy}
                    onClick={() => confirm("Ջնջե՞լ կարծիքը") && run(() => deleteReview(r.id))}
                  >
                    Ջնջել
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Section>
  );
}
