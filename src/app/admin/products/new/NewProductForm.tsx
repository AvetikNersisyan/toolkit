"use client";

import { useActionState, useState } from "react";
import { createProduct } from "../actions";
import { Field, inputClass } from "../fields";

export function NewProductForm() {
  const [state, action, pending] = useActionState(createProduct, null);
  // Controlled, because React resets uncontrolled fields after a form action: a validation error would wipe the input.
  const [v, setV] = useState({ name: "", slug: "", price: "" });
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  const bind = (key: keyof typeof v) => ({
    name: key,
    value: v[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <form action={action} className="flex max-w-[560px] flex-col gap-4">
      <Field label="Անուն" error={errors.name}>
        <input {...bind("name")} required className={inputClass} placeholder="Պերֆորատոր Makita DHR202" />
      </Field>
      <Field label="Հասցե (URL)" hint="toolkit.am/<հասցե> · լատինատառ, օր.՝ hammer-drill" error={errors.slug}>
        <input {...bind("slug")} required className={inputClass} placeholder="hammer-drill" autoCapitalize="none" spellCheck={false} />
      </Field>
      <Field label="Գին, ֏" error={errors.price}>
        <input {...bind("price")} required inputMode="numeric" className={inputClass} placeholder="45000" />
      </Field>
      {state && !state.ok && !state.fieldErrors ? <p className="text-sm font-medium text-sale" role="alert">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-accent font-extrabold text-white hover:bg-accent-dark disabled:opacity-70"
      >
        {pending ? "Ստեղծվում է…" : "Ստեղծել և անցնել խմբագրմանը"}
      </button>
      <p className="text-sm text-muted">Ապրանքը կստեղծվի որպես սևագիր. լուսանկարներն ու մնացածը կավելացնեք հաջորդ էջում։</p>
    </form>
  );
}
