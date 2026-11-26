#!/usr/bin/env node
/**
 * Zip apps/extension for Chrome Load unpacked / distribute to staff.
 * Output:
 *   apps/extension/release/an-hung-land-crm-extension-<version>.zip
 *     (public header + README download this name)
 *   apps/extension/release/an-hung-land-crm-extension-latest.zip
 *     (internal copy only — do not link it; the saved filename must include the version)
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

const readme = readFileSync(join(extDir, 'README.md'), 'utf8');
if (!readme.includes(`${baseName}.zip`)) {
  console.error(
    `apps/extension/README.md download href is a static string and must include ${baseName}.zip after a manifest version bump.`,
  );
  process.exit(1);
}
if (readme.includes('](release/an-hung-land-crm-extension-latest.zip)')) {
  console.error(
    'apps/extension/README.md must not link an-hung-land-crm-extension-latest.zip.',
  );
  process.exit(1);
}

const navPath = join(root, 'apps/web/src/features/public/public-extension-nav.tsx');
const navSource = readFileSync(navPath, 'utf8');
if (
  navSource.includes('an-hung-land-crm-extension-latest.zip') ||
  !navSource.includes('extension/manifest.json')
) {
  console.error(
    'Public header download URL must be built from apps/extension/manifest.json version, not latest.zip.',
  );
  process.exit(1);
}

mkdirSync(releaseDir, { recursive: true });

/** Runtime files only (Load unpacked root = zip root). */
const include = [
  'manifest.json',
  'background.js',
  'config.js',
  'content-inbox.js',
  'ext-source.js',
  'ext-person-name.js',
  'ext-refresh-lock.js',
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
