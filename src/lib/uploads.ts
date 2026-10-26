import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Uploaded files live here, outside the repo in production (see DEPLOY.md). */
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

export const MAX_IMAGE_MB = 15;
export const MAX_VIDEO_MB = 60;
/** Larger photos are scaled down to this on the longest side; nothing is ever cropped or padded. */
const MAX_SIDE = 2400;

/** Only names we generate (uuid + extension) are ever read or deleted, so no path tricks are possible. */
export const UPLOAD_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|mp4)$/;

/** Errors with a message safe to show in the admin. */
export class UploadError extends Error {}

async function store(ext: "webp" | "mp4", data: Buffer): Promise<string> {
  const name = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), data);
  return name;
}

/** Re-encodes any supported image as one WebP file. sharp drops EXIF/GPS unless asked to keep it. */
export async function saveImage(file: File): Promise<{ file: string; width: number; height: number }> {
  if (file.size === 0) throw new UploadError("Ֆայլը դատարկ է։");
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new UploadError(`Լուսանկարը ${MAX_IMAGE_MB} ՄԲ-ից մեծ է։`);

  const out = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 80_000_000 })
    .rotate() // apply the camera's EXIF orientation
    .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true })
    .catch(() => {
      throw new UploadError("Ֆայլը նկար չէ կամ ձևաչափը չի աջակցվում (JPEG, PNG, WebP, AVIF)։");
    });
  return { file: await store("webp", out.data), width: out.info.width, height: out.info.height };
}

/** Stores an MP4 as-is (no re-encoding). */
export async function saveVideo(file: File): Promise<string> {
  if (file.size === 0) throw new UploadError("Ֆայլը դատարկ է։");
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new UploadError(`Տեսանյութը ${MAX_VIDEO_MB} ՄԲ-ից մեծ է։`);
  const data = Buffer.from(await file.arrayBuffer());
  // MP4 files start with a box whose type ("ftyp") sits at byte 4; "qt  " is a QuickTime .mov.
  const isMp4 = data.length > 12 && data.toString("latin1", 4, 8) === "ftyp" && data.toString("latin1", 8, 12) !== "qt  ";
  if (!isMp4) throw new UploadError("Միայն MP4 տեսանյութ (H.264)։");
  return store("mp4", data);
}

export async function removeUpload(name: string | null | undefined): Promise<void> {
  if (!name || !UPLOAD_NAME.test(name)) return;
  try {
    await unlink(path.join(UPLOAD_DIR, name));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
