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
    return [
      { source: '/san-pham', destination: '/mua-ban-nha-dat', permanent: true },
      { source: '/san-pham/:slug', destination: '/mua-ban-nha-dat/:slug', permanent: true },
    ];
  },
};

export default nextConfig;
