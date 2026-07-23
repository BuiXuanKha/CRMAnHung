import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { build } from 'esbuild';

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });

const shared = {
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'chrome120',
  logLevel: 'info',
};

await Promise.all([
  build({
    ...shared,
    entryPoints: ['src/background/service-worker.ts'],
    outfile: 'dist/background.js',
  }),
  build({
    ...shared,
    entryPoints: ['src/options/options.ts'],
    outfile: 'dist/options.js',
  }),
  build({
    ...shared,
    entryPoints: ['src/content/content.ts'],
    outfile: 'dist/content.js',
  }),
]);

cpSync('public', 'dist', { recursive: true });
console.log('Extension built → apps/extension/dist');
