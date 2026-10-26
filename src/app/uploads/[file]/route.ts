import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOAD_DIR, UPLOAD_NAME } from "@/lib/uploads";

export const runtime = "nodejs";

// Serves uploaded files. Next's image optimizer reads originals through this route in-process,
// so it is needed even where nginx serves /uploads/ itself. Range support lets videos seek (Safari requires it).

const TYPES = { webp: "image/webp", mp4: "video/mp4" } as const;

const notFound = () => new Response("Not found", { status: 404 });

/** Returns [start, end] for a single "bytes=" range, null when absent, "bad" when unsatisfiable. */
function parseRange(header: string | null, size: number): [number, number] | null | "bad" {
  const m = header?.match(/^bytes=(\d*)-(\d*)$/);
  if (!m || (!m[1] && !m[2])) return null;
  const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
  const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
  return start > end || start >= size ? "bad" : [start, end];
}

export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!UPLOAD_NAME.test(file)) return notFound();

  const full = path.join(UPLOAD_DIR, file);
  let size: number;
  try {
    size = (await stat(full)).size;
  } catch {
    return notFound();
  }

  const headers = {
    "Content-Type": TYPES[file.slice(file.lastIndexOf(".") + 1) as keyof typeof TYPES],
    // Names are random and never reused, so the content behind a URL never changes.
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };
  const body = (s: NodeJS.ReadableStream) => Readable.toWeb(s as Readable) as unknown as ReadableStream;

  const range = parseRange(req.headers.get("range"), size);
  if (range === "bad") return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  if (range) {
    const [start, end] = range;
    return new Response(body(createReadStream(full, { start, end })), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(body(createReadStream(full)), { headers: { ...headers, "Content-Length": String(size) } });
}
