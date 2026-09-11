import { apiFetchBlob } from '@/shared/api/client';

export function normalizeRotationDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function fileNameFromImageUrl(url: string, index: number): string {
  try {
    const path = new URL(url, window.location.origin).pathname;
    const base = path.split('/').pop() || `anh-lo-${index + 1}.jpg`;
    return base.includes('.') ? base : `${base}.jpg`;
  } catch {
    return `anh-lo-${index + 1}.jpg`;
  }
}

export function isCoarsePhoneGallery(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
}

async function blobFromGalleryUrl(url: string): Promise<Blob> {
  const absolute = new URL(url, window.location.origin);
  if (absolute.origin === window.location.origin) {
    const res = await fetch(absolute.href, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Không tải được ảnh');
    const blob = await res.blob();
    if (!blob.size) throw new Error('Không tải được ảnh');
    return blob;
  }
  return apiFetchBlob(`/storage/public-image?url=${encodeURIComponent(url)}`);
}

async function rotateBlob(blob: Blob, rotationDeg: number, maxDim = 0): Promise<Blob> {
  const deg = normalizeRotationDeg(rotationDeg);
  if (!deg && maxDim <= 0) return blob;

  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Không đọc được ảnh'));
      el.src = objectUrl;
    });

    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (maxDim > 0) {
      const shrink = Math.min(1, maxDim / Math.max(width, height));
      width = Math.max(1, Math.round(width * shrink));
      height = Math.max(1, Math.round(height * shrink));
    }

    const swap = deg === 90 || deg === 270;
    const canvas = document.createElement('canvas');
    canvas.width = swap ? height : width;
    canvas.height = swap ? width : height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Không tạo được ảnh tải về');

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);

    const outType = blob.type.includes('png') ? 'image/png' : 'image/jpeg';
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Không tạo được file tải về'))),
        outType,
        0.92,
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function mimeForFileName(fileName: string, blobType: string): string {
  if (blobType && blobType.startsWith('image/')) return blobType;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function downloadFileName(fileName: string, blobType: string): string {
  if (blobType.includes('jpeg') || blobType === 'image/jpg') {
    return fileName.replace(/\.[^.]+$/, '') + '.jpg';
  }
  if (blobType.includes('png')) return fileName.replace(/\.[^.]+$/, '') + '.png';
  return fileName;
}

async function saveBlob(blob: Blob, fileName: string): Promise<'saved' | 'cancelled'> {
  const mime = mimeForFileName(fileName, blob.type);
  const name = downloadFileName(fileName, mime);
  const file = new File([blob], name, { type: mime });

  if (
    isCoarsePhoneGallery() &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file] });
      return 'saved';
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return 'cancelled';
    }
  }

  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
  return 'saved';
}

export async function galleryImageFile(
  url: string,
  rotationDeg: number,
  fileName: string,
  opts?: { maxDim?: number },
): Promise<File> {
  const blob = await rotateBlob(await blobFromGalleryUrl(url), rotationDeg, opts?.maxDim ?? 0);
  const mime = mimeForFileName(fileName, blob.type);
  const name = downloadFileName(fileName, mime);
  return new File([blob], name, { type: mime });
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không đọc được ảnh'));
    reader.readAsDataURL(file);
  });
}

/** Download the current gallery image in-place. Never opens a new tab. */
export async function downloadGalleryImage(url: string, rotationDeg: number, fileName: string) {
  const file = await galleryImageFile(url, rotationDeg, fileName);
  return saveBlob(file, file.name);
}
