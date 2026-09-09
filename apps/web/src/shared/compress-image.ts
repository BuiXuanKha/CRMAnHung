/**
 * Shrink phone photos before multipart upload (CRM lodat / similar).
 * Matches server public WebP long-edge cap; falls back to the original file.
 */

export const CRM_UPLOAD_MAX_EDGE = 2560;
/** Skip work when the file is already small enough for mobile uplink. */
const SKIP_IF_BYTES_AT_OR_UNDER = 350_000;
/** Keep original when resize would not help much. */
const SKIP_IF_BYTES_AND_FITS_EDGE = 900_000;

export type CompressImageOptions = {
  maxEdge?: number;
  /** JPEG quality 0–1 */
  quality?: number;
};

function baseName(fileName: string): string {
  const trimmed = fileName.trim() || 'anh';
  return trimmed.replace(/\.[^.]+$/, '') || 'anh';
}

/**
 * Decode → optional downscale → JPEG. Returns `file` unchanged on failure / no win.
 */
export async function compressImageForUpload(
  file: File,
  options?: CompressImageOptions,
): Promise<File> {
  if (typeof window === 'undefined') return file;
  const mime = String(file.type || '').toLowerCase();
  if (!mime.startsWith('image/') || mime.includes('svg') || mime === 'image/gif') {
    return file;
  }
  if (file.size > 0 && file.size <= SKIP_IF_BYTES_AT_OR_UNDER) return file;

  const maxEdge = options?.maxEdge ?? CRM_UPLOAD_MAX_EDGE;
  const quality = options?.quality ?? 0.82;

  try {
    const bitmap = await createImageBitmap(file);
    const longEdge = Math.max(bitmap.width, bitmap.height);
    const scale = longEdge > maxEdge ? maxEdge / longEdge : 1;

    if (
      scale === 1 &&
      file.size <= SKIP_IF_BYTES_AND_FITS_EDGE &&
      (mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/jpg')
    ) {
      bitmap.close();
      return file;
    }

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
    });
    if (!blob || blob.size === 0) return file;
    // Prefer original when compression barely helps (or enlarges).
    if (blob.size >= file.size * 0.92) return file;

    return new File([blob], `${baseName(file.name)}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

/** Run async work over items with a fixed concurrency pool. */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!items.length) return [];
  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results = new Array<R>(items.length);
  let next = 0;

  async function worker() {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]!, index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}
