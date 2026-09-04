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
  // Local same-origin `/api/v1` → Nest (HttpOnly cookies work; matches nginx prod).
  async rewrites() {
    const target = (process.env.INTERNAL_API_ORIGIN ?? 'http://127.0.0.1:5050').replace(
      /\/$/,
      '',
    );
    return [
      {
        source: '/api/v1/:path*',
        destination: `${target}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
