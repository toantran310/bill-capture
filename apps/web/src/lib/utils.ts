import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Delivery lives at the instance origin; only upload/sign go through /api.
const DELIVERY_BASE =
  (import.meta.env.VITE_OPENINARY_DELIVERY_URL as string | undefined) ??
  "https://openinary.toantran.duckdns.org";

export const openinaryUrl = (path: string) =>
  `${DELIVERY_BASE}/t/${path.split("/").map(encodeURIComponent).join("/")}`;

export const openinaryThumbnailUrl = (path: string) =>
  `${DELIVERY_BASE}/t/w_300,h_300/${path.split("/").map(encodeURIComponent).join("/")}`;

export const IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const MAX_EDGE = 2000;       // long edge in px
const JPEG_QUALITY = 0.8;

/**
 * Downscale + re-encode a photo as JPEG before upload.
 * The browser applies EXIF orientation while decoding, so the output is
 * upright and carries no orientation tag. Delivery URLs must therefore
 * not rotate it again.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale);
    const h = Math.round(bmp.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; // transparency would turn black in JPEG
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();

    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;

    return new File([blob], "bill.jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file; // undecodable format: upload as-is rather than block
  }
}
