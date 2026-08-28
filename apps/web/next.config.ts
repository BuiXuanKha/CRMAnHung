import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  // Thư mục build riêng — PM2 chạy root từng ghi đè `.next/standalone` nên `next build` không xóa được.
  distDir: '.next-build',
  // Monorepo: trace deps từ root workspace
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@crmanhung/shared'],
  async redirects() {
    const list = '/mua-ban-nha-dat-huyen-nam-sach';
    return [
      { source: '/san-pham', destination: list, permanent: true },
      { source: '/san-pham/:path*', destination: `${list}/:path*`, permanent: true },
      { source: '/mua-ban-nha-dat', destination: list, permanent: true },
      { source: '/mua-ban-nha-dat/:path*', destination: `${list}/:path*`, permanent: true },
    ];
  },
};

export default nextConfig;
