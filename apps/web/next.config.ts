import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  // Monorepo: trace deps từ root workspace
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@crmanhung/shared'],
};

export default nextConfig;
