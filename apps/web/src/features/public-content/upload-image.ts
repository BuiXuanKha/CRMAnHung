/**
 * Upload ảnh bài viết (bìa + ảnh trong body) lên R2 public.
 * Mock: object URL tạm. API thật: POST /admin/public-web/media (slice sau).
 */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadPublicPostImage(file: File): Promise<string> {
  if (!ACCEPT.has(file.type)) {
    throw new Error('Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Ảnh tối đa 5 MB.');
  }

  // Mock / offline: giữ URL cục bộ để preview trong session.
  // Khi nối API: FormData → StorageService.upload() → CDN URL.
  return URL.createObjectURL(file);
}
