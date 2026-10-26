#!/usr/bin/env node
/**
 * Zip apps/extension for Chrome Load unpacked / distribute to staff.
 * Output:
 *   apps/extension/release/an-hung-land-crm-extension-<version>.zip
 *   apps/extension/release/an-hung-land-crm-extension-latest.zip
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const extDir = join(root, 'apps/extension');
const manifestPath = join(extDir, 'manifest.json');
const releaseDir = join(extDir, 'release');

if (!existsSync(manifestPath)) {
  console.error('Missing apps/extension/manifest.json');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const version = String(manifest.version || '0.0.0').trim();
const baseName = `an-hung-land-crm-extension-${version}`;
const zipPath = join(releaseDir, `${baseName}.zip`);
const latestPath = join(releaseDir, 'an-hung-land-crm-extension-latest.zip');

mkdirSync(releaseDir, { recursive: true });

/** Runtime files only (Load unpacked root = zip root). */
const include = [
  'manifest.json',
  'background.js',
  'config.js',
  'content-inbox.js',
  'ext-source.js',
  'ext-person-name.js',
  'ext-context-business-suite.js',
  'ext-context-facebook-com.js',
  'options.html',
  'options.js',
  'README.md',
  'scanners/scanner-messenger-web.js',
];

for (const rel of include) {
  if (!existsSync(join(extDir, rel))) {
    console.error(`Missing required file: apps/extension/${rel}`);
    process.exit(1);
  }
}

if (existsSync(zipPath)) {
  spawnSync('rm', ['-f', zipPath], { stdio: 'inherit' });
}

const zipR = spawnSync('zip', ['-r', zipPath, ...include], {
  cwd: extDir,
  encoding: 'utf8',
});
if (zipR.status !== 0) {
  console.error(zipR.stderr || 'zip failed — install zip(1)');
  process.exit(1);
}

copyFileSync(zipPath, latestPath);

console.log(`OK  ${zipPath}`);
console.log(`OK  ${latestPath}`);
