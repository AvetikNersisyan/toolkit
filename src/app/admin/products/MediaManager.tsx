"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageKind } from "@/db/schema";
import { deleteImage, moveImage, removeVideo, uploadImage, uploadVideo } from "./actions";
import { Section, smallButton } from "./fields";
import type { ActionResult } from "./input";

type Img = { id: number; src: string; width: number; height: number };

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif";
const isSquare = (i: Img) => Math.abs(i.width / i.height - 1) <= 0.03;

/** A button that opens the file picker. */
function FilePick({ label, accept, multiple, disabled, onFiles }: {
  label: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}) {
  return (
    <label
      className={`flex min-h-11 w-fit cursor-pointer items-center rounded-lg bg-ink px-4 text-sm font-bold text-white hover:bg-ink-2 ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      {label}
      <input
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = ""; // allow picking the same file again
          if (files.length) onFiles(files);
        }}
      />
    </label>
  );
}

export function MediaManager({
  productId,
  gallery,
  box,
  poster,
  videoSrc,
  maxImageMb,
  maxVideoMb,
}: {
  productId: number;
  gallery: Img[];
  box?: Img;
  poster?: Img;
  videoSrc?: string;
  maxImageMb: number;
  maxVideoMb: number;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  /** Runs one server action at a time and collects its error, if any. */
  async function run(label: string, fn: () => Promise<ActionResult>): Promise<string | null> {
    setBusy(label);
    try {
      const r = await fn();
      return r.ok ? null : r.error;
    } catch {
      return "Կապի խնդիր։ Փորձեք կրկին։";
    } finally {
      setBusy(null);
    }
  }

  async function uploadImages(kind: ImageKind, files: File[]) {
    setErrors([]);
    const errs: string[] = [];
    for (const [i, f] of files.entries()) {
      if (f.size > maxImageMb * 1024 * 1024) {
        errs.push(`${f.name}: ${maxImageMb} ՄԲ-ից մեծ է`);
        continue;
      }
      const fd = new FormData();
      fd.append("file", f);
      const err = await run(`Վերբեռնվում է ${i + 1}/${files.length}…`, () => uploadImage(productId, kind, fd));
      if (err) errs.push(`${f.name}: ${err}`);
    }
    setErrors(errs);
  }

  async function single(label: string, fn: () => Promise<ActionResult>) {
    setErrors([]);
    const err = await run(label, fn);
    if (err) setErrors([err]);
  }

  async function onVideo(files: File[]) {
    const f = files[0];
    if (f.size > maxVideoMb * 1024 * 1024) return setErrors([`${f.name}: ${maxVideoMb} ՄԲ-ից մեծ է`]);
    const fd = new FormData();
    fd.append("file", f);
    await single("Տեսանյութը վերբեռնվում է…", () => uploadVideo(productId, fd));
  }

  const disabled = busy !== null;

  return (
    <Section
      title="Լուսանկարներ և տեսանյութ"
      hint={`JPEG, PNG, WebP կամ AVIF՝ մինչև ${maxImageMb} ՄԲ · պահվում են WebP ձևաչափով · լավագույնը՝ քառակուսի, 1200×1200 և ավելի`}
    >
      <div aria-live="polite" className="flex flex-col gap-1">
        {busy ? <p className="text-sm font-bold">{busy}</p> : null}
        {errors.map((e) => (
          <p key={e} className="text-sm font-medium text-sale">
            {e}
          </p>
        ))}
      </div>

      {/* Gallery */}
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="font-bold">Պատկերասրահ</h3>
          <p className="text-sm text-muted">Առաջինը գլխավորն է. լավ է՝ նույնը, ինչ գովազդում։</p>
        </div>
        {gallery.length ? (
          <ul className="flex flex-wrap gap-3">
            {gallery.map((img, i) => (
              <li key={img.id} className="flex w-[150px] flex-col gap-1.5">
                <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-placeholder">
                  <Image src={img.src} alt="" fill sizes="150px" className="object-contain" />
                  {i === 0 ? (
                    <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-[11px] font-bold text-white">Գլխավոր</span>
                  ) : null}
                  {!isSquare(img) ? (
                    <span
                      className="absolute bottom-1 left-1 rounded bg-highlight px-1.5 py-0.5 text-[11px] font-bold"
                      title="Քառակուսի չէ. կայքում շուրջը կլինեն դատարկ շերտեր"
                    >
                      {img.width}×{img.height}
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className={smallButton}
                    disabled={disabled || i === 0}
                    onClick={() => single("Տեղափոխվում է…", () => moveImage(img.id, -1))}
                    aria-label="Տեղափոխել ձախ"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className={smallButton}
                    disabled={disabled || i === gallery.length - 1}
                    onClick={() => single("Տեղափոխվում է…", () => moveImage(img.id, 1))}
                    aria-label="Տեղափոխել աջ"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className={`${smallButton} ml-auto`}
                    disabled={disabled}
                    onClick={() => confirm("Ջնջե՞լ լուսանկարը") && single("Ջնջվում է…", () => deleteImage(img.id))}
                  >
                    Ջնջել
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Լուսանկարներ դեռ չկան։</p>
        )}
        <FilePick label="+ Ավելացնել լուսանկարներ" accept={IMAGE_TYPES} multiple disabled={disabled} onFiles={(f) => uploadImages("gallery", f)} />
      </div>

      {/* Single-image slots */}
      <div className="grid gap-5 sm:grid-cols-2">
        {(
          [
            ["box", "Տուփի պարունակություն", "Բոլոր պարագաները դասավորված · չկա՝ ցուցադրվում է միայն ցուցակը", box],
            ["poster", "Տեսանյութի շապիկ", "MP4-ի առաջին կադրի փոխարեն · չկա՝ ցուցադրվում է առաջին կադրը", poster],
          ] as const
        ).map(([kind, title, hint, img]) => (
          <div key={kind} className="flex flex-col gap-2">
            <h3 className="font-bold">{title}</h3>
            <p className="text-sm text-muted">{hint}</p>
            {img ? (
              <div className="relative aspect-[4/3] w-full max-w-[280px] overflow-hidden rounded-lg border border-line bg-placeholder">
                <Image src={img.src} alt="" fill sizes="280px" className="object-contain" />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <FilePick label={img ? "Փոխարինել" : "+ Վերբեռնել"} accept={IMAGE_TYPES} disabled={disabled} onFiles={(f) => uploadImages(kind, f.slice(0, 1))} />
              {img ? (
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-[#8a939a] px-4 text-sm hover:bg-soft disabled:opacity-50"
                  disabled={disabled}
                  onClick={() => confirm("Ջնջե՞լ") && single("Ջնջվում է…", () => deleteImage(img.id))}
                >
                  Ջնջել
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Video */}
      <div className="flex flex-col gap-2">
        <h3 className="font-bold">Տեսանյութ (MP4)</h3>
        <p className="text-sm text-muted">MP4 (H.264), մինչև {maxVideoMb} ՄԲ, պահվում է առանց փոփոխության · գերակայում է YouTube հղումից</p>
        {videoSrc ? (
          <video src={videoSrc} controls muted playsInline preload="metadata" className="w-full max-w-[420px] rounded-lg bg-black" />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <FilePick label={videoSrc ? "Փոխարինել" : "+ Վերբեռնել MP4"} accept="video/mp4" disabled={disabled} onFiles={onVideo} />
          {videoSrc ? (
            <button
              type="button"
              className="min-h-11 rounded-lg border border-[#8a939a] px-4 text-sm hover:bg-soft disabled:opacity-50"
              disabled={disabled}
              onClick={() => confirm("Ջնջե՞լ տեսանյութը") && single("Ջնջվում է…", () => removeVideo(productId))}
            >
              Ջնջել
            </button>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
