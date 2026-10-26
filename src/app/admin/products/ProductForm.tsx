"use client";

import { useEffect, useState, useTransition } from "react";
import type { ProductStatus } from "@/db/schema";
import { PRODUCT_STATUS_LABEL } from "../statuses";
import { saveProduct } from "./actions";
import { Field, inputClass, Section, smallButton } from "./fields";
import type { ActionResult, FieldErrors, ProductFormValues } from "./input";

type Other = { id: number; name: string; status: ProductStatus };
// Taken from the labels so this client file doesn't pull the database schema into the browser bundle.
const STATUSES = Object.keys(PRODUCT_STATUS_LABEL) as ProductStatus[];
type TextKey = { [K in keyof ProductFormValues]: ProductFormValues[K] extends string ? K : never }[keyof ProductFormValues];

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function RowControls({ index, count, onChange }: { index: number; count: number; onChange: (op: "up" | "down" | "remove") => void }) {
  return (
    <div className="flex flex-none gap-1">
      <button type="button" className={smallButton} onClick={() => onChange("up")} disabled={index === 0} aria-label="Վեր">
        ↑
      </button>
      <button type="button" className={smallButton} onClick={() => onChange("down")} disabled={index === count - 1} aria-label="Վար">
        ↓
      </button>
      <button type="button" className={smallButton} onClick={() => onChange("remove")} aria-label="Հեռացնել">
        ✕
      </button>
    </div>
  );
}

function apply<T>(list: T[], i: number, op: "up" | "down" | "remove"): T[] {
  if (op === "remove") return list.filter((_, j) => j !== i);
  return move(list, i, op === "up" ? -1 : 1);
}

/** Editable list of single-line strings. */
function LinesEditor({ items, onChange, placeholder, max }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; max: number }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className={inputClass}
            value={item}
            placeholder={placeholder}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <RowControls index={i} count={items.length} onChange={(op) => onChange(apply(items, i, op))} />
        </div>
      ))}
      <button type="button" className={`${smallButton} w-fit`} onClick={() => onChange([...items, ""])} disabled={items.length >= max}>
        + Ավելացնել տող
      </button>
    </div>
  );
}

type Column<T> = { key: keyof T & string; label: string; textarea?: boolean; width?: string };

/** Editable list of small objects (benefits, specs, FAQ). */
function RowsEditor<T extends Record<string, string>>({
  rows,
  onChange,
  columns,
  empty,
  max,
}: {
  rows: T[];
  onChange: (v: T[]) => void;
  columns: Column<T>[];
  empty: T;
  max: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg bg-soft p-2.5">
          {columns.map((c) => (
            <label key={c.key} className={`flex min-w-0 flex-col gap-1 ${c.width ?? "flex-[1_1_200px]"}`}>
              <span className="text-xs font-medium text-muted">{c.label}</span>
              {c.textarea ? (
                <textarea
                  rows={2}
                  className={`${inputClass} py-2`}
                  value={row[c.key]}
                  onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))}
                />
              ) : (
                <input
                  className={inputClass}
                  value={row[c.key]}
                  onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, [c.key]: e.target.value } : r)))}
                />
              )}
            </label>
          ))}
          <RowControls index={i} count={rows.length} onChange={(op) => onChange(apply(rows, i, op))} />
        </div>
      ))}
      <button type="button" className={`${smallButton} w-fit`} onClick={() => onChange([...rows, { ...empty }])} disabled={rows.length >= max}>
        + Ավելացնել
      </button>
    </div>
  );
}

export function ProductForm({ productId, initial, others }: { productId: number; initial: ProductFormValues; others: Other[] }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  const errors: FieldErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const text = (key: TextKey) => ({
    value: v[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const r = await saveProduct(productId, v);
        setResult(r);
        if (r.ok) setSaved(v);
      } catch {
        setResult({ ok: false, error: "Չհաջողվեց պահպանել։ Ստուգեք կապը և փորձեք կրկին։" });
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Section title="Հիմնական">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Անուն" error={errors.name}>
            <input className={inputClass} {...text("name")} />
          </Field>
          <Field label="Հասցե (URL)" hint="toolkit.am/<հասցե> · փոխելիս հին հղումը կդադարի աշխատել" error={errors.slug}>
            <input className={inputClass} {...text("slug")} autoCapitalize="none" spellCheck={false} />
          </Field>
          <Field label="Կարգավիճակ" hint="Հրապարակելու համար պետք է առնվազն մեկ լուսանկար" error={errors.status}>
            <select className={inputClass} value={v.status} onChange={(e) => set("status", e.target.value as ProductStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {PRODUCT_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Հերթականություն" hint="Փոքր թիվը՝ առաջինը գլխավոր էջում" error={errors.sortOrder}>
            <input className={inputClass} inputMode="numeric" {...text("sortOrder")} />
          </Field>
          <Field label="Կարճ անուն" hint="Քարտերի համար, օր.՝ Պերֆորատոր" error={errors.shortName}>
            <input className={inputClass} {...text("shortName")} />
          </Field>
          <Field label="Բրենդ" error={errors.brand}>
            <input className={inputClass} {...text("brand")} />
          </Field>
        </div>
      </Section>

      <Section title="Գին և ակցիա">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Գին, ֏" error={errors.price}>
            <input className={inputClass} inputMode="numeric" {...text("price")} />
          </Field>
          <Field label="Հին գին, ֏" hint="Դատարկ՝ առանց զեղչի" error={errors.oldPrice}>
            <input className={inputClass} inputMode="numeric" {...text("oldPrice")} />
          </Field>
          <Field label="Ակցիայի ավարտ" hint="Երևանի ժամով · դատարկ՝ առանց հետհաշվարկի" error={errors.offerEnd}>
            <input type="datetime-local" className={inputClass} {...text("offerEnd")} />
          </Field>
          <Field label="Նվեր" hint="օր.՝ Նվեր՝ գայլիկոնների հավաքածու" error={errors.gift}>
            <input className={inputClass} {...text("gift")} />
          </Field>
          <Field label="Պահեստի նշում" hint="Միայն իրական թվեր, օր.՝ Պահեստում մնացել է 12 հատ" error={errors.stockNote}>
            <input className={inputClass} {...text("stockNote")} />
          </Field>
        </div>
      </Section>

      <Section title="Նկարագրություն">
        <Field label="Ենթավերնագիր" error={errors.subheadline}>
          <textarea rows={3} className={`${inputClass} py-2`} {...text("subheadline")} />
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-medium">Հիմնական կետեր (✓ ցուցակ)</span>
          <LinesEditor items={v.highlights} onChange={(x) => set("highlights", x)} placeholder="Հարվածի էներգիա՝ 2 Ջ" max={12} />
          {errors.highlights ? <span className="text-sm text-sale">{errors.highlights}</span> : null}
        </div>
      </Section>

      <Section title="Առավելություններ" hint="Քարտեր «Ինչու՞ այս գործիքը» բաժնում · դատարկ՝ բաժինը չի ցուցադրվի" error={errors.benefits}>
        <RowsEditor
          rows={v.benefits}
          onChange={(x) => set("benefits", x)}
          empty={{ value: "", title: "", text: "" }}
          max={12}
          columns={[
            { key: "value", label: "Թիվ / բառ", width: "flex-[0_1_140px]" },
            { key: "title", label: "Վերնագիր" },
            { key: "text", label: "Տեքստ", textarea: true, width: "flex-[2_1_260px]" },
          ]}
        />
      </Section>

      <Section title="Տեխնիկական բնութագիր" hint="Դատարկ՝ բաժինը չի ցուցադրվի" error={errors.specs}>
        <RowsEditor
          rows={v.specs}
          onChange={(x) => set("specs", x)}
          empty={{ label: "", value: "" }}
          max={40}
          columns={[
            { key: "label", label: "Անուն" },
            { key: "value", label: "Արժեք" },
          ]}
        />
      </Section>

      <Section title="Տուփի պարունակությունը" hint="Ցուցակ · տուփի լուսանկարը ավելացրեք վերևում" error={errors.inTheBox}>
        <LinesEditor items={v.inTheBox} onChange={(x) => set("inTheBox", x)} placeholder="Պլաստիկ կեյս" max={30} />
      </Section>

      <Section title="Լրացուցիչ ապրանք (upsell)" hint="Անունը դատարկ՝ չի առաջարկվի">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Անուն" error={errors.addonName}>
            <input className={inputClass} {...text("addonName")} />
          </Field>
          <Field label="Գին, ֏" error={errors.addonPrice}>
            <input className={inputClass} inputMode="numeric" {...text("addonPrice")} />
          </Field>
          <Field label="Նշում" hint="օր.՝ միայն այս պատվերի հետ" error={errors.addonNote}>
            <input className={inputClass} {...text("addonNote")} />
          </Field>
        </div>
      </Section>

      <Section title="YouTube տեսանյութ" hint="Վերևում վերբեռնված MP4-ը գերակայում է YouTube-ից">
        <Field label="YouTube հղում կամ ID" error={errors.youtube}>
          <input className={inputClass} {...text("youtube")} placeholder="https://youtu.be/…" spellCheck={false} />
        </Field>
      </Section>

      <Section title="Հաճախ տրվող հարցեր" hint="Ավելացվում են ընդհանուր հարցերին (վճարում, առաքում, երաշխիք)" error={errors.faq}>
        <RowsEditor
          rows={v.faq}
          onChange={(x) => set("faq", x)}
          empty={{ q: "", a: "" }}
          max={20}
          columns={[
            { key: "q", label: "Հարց" },
            { key: "a", label: "Պատասխան", textarea: true, width: "flex-[2_1_300px]" },
          ]}
        />
      </Section>

      <Section title="Այլ ապրանքներ էջի ներքևում" hint="Ցուցադրվում են նշելու հերթականությամբ · միայն հրապարակվածները" error={errors.relatedIds}>
        {others.length === 0 ? (
          <p className="text-sm text-muted">Այլ ապրանքներ դեռ չկան։</p>
        ) : (
          <div className="flex flex-col gap-2">
            {others.map((o) => {
              const pos = v.relatedIds.indexOf(o.id);
              return (
                <label key={o.id} className="flex min-h-11 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-ink"
                    checked={pos >= 0}
                    onChange={(e) =>
                      set("relatedIds", e.target.checked ? [...v.relatedIds, o.id] : v.relatedIds.filter((x) => x !== o.id))
                    }
                  />
                  <span>{o.name}</span>
                  {o.status !== "published" ? <span className="text-xs text-muted">({PRODUCT_STATUS_LABEL[o.status]})</span> : null}
                  {pos >= 0 ? <span className="text-xs font-bold text-muted">#{pos + 1}</span> : null}
                </label>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Facebook / Google նկարագրություն">
        <Field label="Կարճ նկարագրություն" hint="Երևում է հղումը կիսվելիս" error={errors.metaDescription}>
          <textarea rows={2} className={`${inputClass} py-2`} {...text("metaDescription")} />
        </Field>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-white px-4 py-3">
        <span className="mr-auto text-sm" role="status">
          {result && !result.ok ? (
            <span className="font-medium text-sale">{result.error}</span>
          ) : dirty ? (
            <span className="text-muted">Կան չպահպանված փոփոխություններ</span>
          ) : result?.ok ? (
            <span className="font-medium text-ok">{result.message}</span>
          ) : null}
        </span>
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-lg bg-accent px-6 font-extrabold text-white hover:bg-accent-dark disabled:opacity-70"
        >
          {pending ? "Պահպանվում է…" : "Պահպանել"}
        </button>
      </div>
    </form>
  );
}
