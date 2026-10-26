import { ImageIcon } from "./Icons";

/** Shown wherever a product photo/video file hasn't been added yet. */
export function Placeholder({ label, hint, className = "" }: { label: string; hint?: string; className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#b9c0c6] bg-placeholder p-4 text-center text-muted ${className}`}
    >
      <ImageIcon className="h-10 w-10" />
      <div className="font-bold">{label}</div>
      {hint ? <div className="text-sm">{hint}</div> : null}
    </div>
  );
}
