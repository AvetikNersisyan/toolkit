// Small form building blocks shared by the product editor pages.

export const inputClass =
  "min-h-11 w-full rounded-lg border border-[#8a939a] bg-white px-3 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/20";

export const smallButton =
  "flex min-h-9 items-center justify-center rounded-md border border-[#8a939a] px-2.5 text-sm hover:bg-soft disabled:opacity-40";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  // A wrapping <label> ties the text to the control without needing ids.
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[15px] font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      {error ? <span className="text-sm text-sale">{error}</span> : null}
    </label>
  );
}

export function Section({ title, hint, error, children }: { title: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-line p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-extrabold">{title}</h2>
        {hint ? <p className="text-sm text-muted">{hint}</p> : null}
        {error ? <p className="text-sm font-medium text-sale">{error}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** File types the upload pipeline (sharp) accepts. */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
