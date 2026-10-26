/** 19900 → "19 900 ֏" */
export function formatAmd(n: number): string {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ֏`;
}

export function discountPercent(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

/**
 * Normalizes an Armenian phone number to +374XXXXXXXX.
 * Accepts "+374 93 123456", "093123456", "93 12 34 56", "00374...".
 * Returns null when it doesn't look like an Armenian number.
 */
export function normalizeArmenianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("374")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 8) return null;
  return `+374${digits}`;
}
