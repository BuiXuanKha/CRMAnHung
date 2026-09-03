import { BadRequestException } from '@nestjs/common';
import {
  fileNameFromPublicImageUrl,
  isAllowedPublicCdnImageUrl,
} from './public-cdn-url';

const MAX_PUBLIC_IMAGE_BYTES = 15 * 1024 * 1024;

export async function fetchPublicCdnImage(
  rawUrl: string,
  publicBaseUrl: string,
): Promise<{
  buffer: Buffer;
  contentType: string;
  fileName: string;
}> {
  if (!isAllowedPublicCdnImageUrl(rawUrl, publicBaseUrl)) {
    throw new BadRequestException('URL ảnh không hợp lệ.');
  }

  let res: Response;
  try {
    res = await fetch(rawUrl.trim(), {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
      headers: { Accept: 'image/*' },
    });
  } catch {
    throw new BadRequestException('Không tải được ảnh.');
  }

  if (!res.ok) {
    throw new BadRequestException('Không tải được ảnh.');
  }

  const contentType = (res.headers.get('content-type') || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!contentType.startsWith('image/')) {
    throw new BadRequestException('URL không phải ảnh.');
  }

  const declared = Number(res.headers.get('content-length') || '0');
  if (declared > MAX_PUBLIC_IMAGE_BYTES) {
    throw new BadRequestException('Ảnh quá lớn để tải về.');
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_PUBLIC_IMAGE_BYTES) {
    throw new BadRequestException('Ảnh quá lớn để tải về.');
  }
  if (!buffer.length) {
    throw new BadRequestException('Không tải được ảnh.');
  }

  return {
    buffer,
    contentType,
    fileName: fileNameFromPublicImageUrl(rawUrl),
  };
}
