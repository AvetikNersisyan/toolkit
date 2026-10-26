"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { formatAmd, normalizeArmenianPhone } from "@/lib/format";
import { calcTotal, MAX_QTY } from "@/lib/pricing";
import type { Product } from "@/lib/product-types";
import { newEventId, ORDER_EVENT, readAttribution, track } from "@/lib/tracking";
import { SuccessIcon } from "./Icons";

type Props = {
  product: Pick<Product, "id" | "name" | "price" | "oldPrice" | "addon">;
  image: string | null;
  deliveryPriceText: string;
  callbackMinutes: number;
};

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string } | { kind: "done"; orderId: number };

export function OrderSection({ product, image, deliveryPriceText, callbackMinutes }: Props) {
  const [qty, setQty] = useState(1);
  const [addon, setAddon] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const checkoutTracked = useRef(false);
  const honeypot = useRef<HTMLInputElement>(null);

  const total = calcTotal(product, qty, addon);
  const contentId = String(product.id);

  function onFirstFocus() {
    if (checkoutTracked.current) return;
    checkoutTracked.current = true;
    track("InitiateCheckout", { content_ids: [contentId], content_type: "product", value: total, currency: "AMD" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind === "sending") return;

    const nextErrors: typeof errors = {};
    if (name.trim().length < 2) nextErrors.name = "Գրեք Ձեր անունը";
    if (!normalizeArmenianPhone(phone)) nextErrors.phone = "Գրեք ճիշտ հեռախոսահամար, օր.՝ 093 123456";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus({ kind: "sending" });
    const eventId = newEventId();
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          qty,
          addon,
          name: name.trim(),
          phone,
          website: honeypot.current?.value ?? "",
          eventId,
          pageUrl: window.location.href,
          ...readAttribution(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; orderId?: number; error?: string };
      if (!res.ok || !data.ok) {
        setStatus({ kind: "error", message: data.error ?? "Չհաջողվեց ուղարկել պատվերը։ Փորձեք կրկին կամ զանգահարեք մեզ։" });
        return;
      }
      track(
        ORDER_EVENT,
        { content_ids: [contentId], content_type: "product", num_items: qty, value: total, currency: "AMD" },
        eventId,
      );
      setStatus({ kind: "done", orderId: data.orderId ?? 0 });
    } catch {
      setStatus({ kind: "error", message: "Կապի խնդիր։ Ստուգեք ինտերնետը և փորձեք կրկին։" });
    }
  }

  return (
    <div className="flex flex-wrap gap-8 rounded-2xl border-2 border-ink p-5 sm:p-6">
      {/* Summary */}
      <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative h-20 w-20 flex-none overflow-hidden rounded-lg border border-line bg-placeholder">
            {image ? <Image src={image} alt="" fill sizes="80px" className="object-contain" /> : null}
          </div>
          <div className="flex flex-col gap-1">
            <div className="font-bold">{product.name}</div>
            <div>
              <span className="font-extrabold">{formatAmd(product.price)}</span>{" "}
              {product.oldPrice ? <s className="text-sm text-muted">{formatAmd(product.oldPrice)}</s> : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">Քանակ</span>
          <div className="flex items-center rounded-[10px] border border-[#b9c0c6]">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Պակասեցնել"
              disabled={status.kind === "done"}
              className="h-11 w-11 text-2xl"
            >
              −
            </button>
            <span className="min-w-8 text-center font-bold" aria-live="polite">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
              aria-label="Ավելացնել"
              disabled={status.kind === "done"}
              className="h-11 w-11 text-2xl"
            >
              +
            </button>
          </div>
        </div>

        {product.addon ? (
          <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-highlight bg-[#fef9c3] p-3.5">
            <input
              type="checkbox"
              checked={addon}
              onChange={(e) => setAddon(e.target.checked)}
              disabled={status.kind === "done"}
              className="h-[22px] w-[22px] flex-none accent-ink"
            />
            <span>
              <span className="block font-bold">Ավելացնել՝ {product.addon.name}</span>
              <span className="text-sm text-ink-2">
                +{formatAmd(product.addon.price)}
                {product.addon.note ? ` · ${product.addon.note}` : ""}
              </span>
            </span>
          </label>
        ) : null}

        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4">
          <span className="text-lg font-bold">Ընդհանուր</span>
          <span className="text-[28px] font-extrabold">{formatAmd(total)}</span>
        </div>
        <div className="text-sm text-ink-2">Առաքում՝ {deliveryPriceText}</div>
      </div>

      {/* Form / result */}
      <div className="min-w-0 flex-[1_1_340px]">
        {status.kind === "done" ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-[#86efac] bg-[#f0fdf4] p-7" role="status">
            <SuccessIcon className="h-10 w-10 text-ok" />
            <div className="text-[22px] font-extrabold">Շնորհակալություն, պատվերն ընդունված է</div>
            <div className="text-ink-2">
              Պատվեր №{status.orderId}։ Մենք կզանգահարենք Ձեզ {callbackMinutes} րոպեի ընթացքում՝ առաքման օրն ու ժամը
              համաձայնեցնելու համար։
            </div>
          </div>
        ) : (
          <form onSubmit={submit} onFocus={onFirstFocus} noValidate className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-name" className="text-[15px] font-medium">Անուն</label>
              <input
                id="f-name"
                type="text"
                autoComplete="name"
                placeholder="Ձեր անունը"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "f-name-err" : undefined}
                className="min-h-12 rounded-[10px] border border-[#8a939a] px-3.5 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/20"
              />
              {errors.name ? <span id="f-name-err" className="text-sm text-sale">{errors.name}</span> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-phone" className="text-[15px] font-medium">Հեռախոս</label>
              <input
                id="f-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+374 __ ___ ___"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "f-phone-err" : undefined}
                className="min-h-12 rounded-[10px] border border-[#8a939a] px-3.5 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/20"
              />
              {errors.phone ? <span id="f-phone-err" className="text-sm text-sale">{errors.phone}</span> : null}
            </div>

            {/* Honeypot: hidden from people, bots tend to fill it */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="f-website">Website</label>
              <input id="f-website" ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <button
              type="submit"
              disabled={status.kind === "sending"}
              className="min-h-14 rounded-[10px] bg-accent text-lg font-extrabold text-white transition hover:bg-accent-dark disabled:opacity-70"
            >
              {status.kind === "sending" ? "Ուղարկվում է…" : "Հաստատել պատվերը"}
            </button>
            {status.kind === "error" ? <div className="text-sm font-medium text-sale" role="alert">{status.message}</div> : null}
            <div className="text-center text-sm text-ink-2">
              Վճարում եք ստանալիս։ Մեր օպերատորը կզանգահարի {callbackMinutes} րոպեի ընթացքում՝ պատվերը հաստատելու համար։
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
