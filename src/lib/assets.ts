import "server-only";
import fs from "node:fs";
import path from "node:path";

/** Returns the public path if the file exists in /public, otherwise null (→ placeholder). */
export function existing(src?: string): string | null {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  return fs.existsSync(path.join(process.cwd(), "public", src)) ? src : null;
}
