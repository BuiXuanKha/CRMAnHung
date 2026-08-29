/**
 * Upload ảnh bài viết / mô tả lô (bìa + ảnh trong TipTap) lên R2 public.
 * Client gửi JPG/PNG/WEBP/GIF; API encode WebP rồi trả URL CDN `.webp`.
 * Mock (login giả): object URL tạm. API thật: POST /admin/public-web/media.
 */
import {
  PUBLIC_MEDIA_ACCEPT_MIME,
  PUBLIC_MEDIA_MAX_BYTES,
  uploadPublicMediaResponseSchema,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';
import { isMockPublicWeb } from '@/shared/api/mode';

const ACCEPT = new Set<string>(PUBLIC_MEDIA_ACCEPT_MIME);

export async function uploadPublicPostImage(file: File): Promise<string> {
  if (!ACCEPT.has(file.type)) {
  if (isMockPublicWeb()) {
    return URL.createObjectURL(file);
  }
  }
  if (file.size > PUBLIC_MEDIA_MAX_BYTES) {
    throw new Error('Ảnh tối đa 5 MB.');
  }

  if (isMockPublicWeb()) {
    return URL.createObjectURL(file);
  }

  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch<unknown>('/admin/public-web/media', {
    method: 'POST',
    body: form,
  });
  const parsed = uploadPublicMediaResponseSchema.safeParse(res);
  if (!parsed.success) {
    throw new Error('Không tải được ảnh lên CDN.');
  }
  return parsed.data.url;
}
