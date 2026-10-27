import { formatRating } from "@/lib/format";
import { StarIcon } from "./Icons";

const STAR_ON = "text-[#f59e0b]";
const STAR_OFF = "text-[#d1d5db]";

/** Five stars filled to `value` (0–5, fractions allowed, e.g. an average of 4.8). */
export function Stars({ value, className = "h-5 w-5" }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(5, value));
  const row = (color: string) =>
    [0, 1, 2, 3, 4].map((i) => <StarIcon key={i} className={`flex-none ${color} ${className}`} />);
  return (
    <span role="img" aria-label={`${formatRating(clamped)} աստղ 5-ից`} className="relative inline-flex flex-none">
      <span className="flex">{row(STAR_OFF)}</span>
      <span className="absolute inset-y-0 left-0 flex overflow-hidden" style={{ width: `${(clamped / 5) * 100}%` }}>
        {row(STAR_ON)}
      </span>
    </span>
  );
}

export { STAR_ON, STAR_OFF };
