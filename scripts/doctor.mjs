#!/usr/bin/env node
/**
 * Kiểm tra toolchain + env trước khi code feature.
 * Usage: pnpm doctor (từ root monorepo)
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiEnv = resolve(root, 'apps/api/.env');
const webEnv = resolve(root, 'apps/web/.env');
const webExample = resolve(root, 'apps/web/.env.example');

let failed = 0;

function ok(msg) {
  console.log(`  OK  ${msg}`);
}
function warn(msg) {
  console.log(` WARN ${msg}`);
}
function bad(msg) {
  console.log(` FAIL ${msg}`);
  failed += 1;
}

function hasCmd(cmd, args = ['--version']) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return r.status === 0;
}

console.log('CRMAnHung doctor\n');

console.log('Toolchain');
if (hasCmd('node')) {
  const v = spawnSync('node', ['-v'], { encoding: 'utf8' }).stdout.trim();
  const major = Number(v.replace(/^v/, '').split('.')[0]);
  if (major >= 22) ok(`node ${v}`);
  else bad(`node ${v} (cần >= 22)`);
} else bad('node không có trong PATH');

if (hasCmd('pnpm')) ok(`pnpm ${spawnSync('pnpm', ['-v'], { encoding: 'utf8' }).stdout.trim()}`);
else bad('pnpm không có');

if (hasCmd('docker', ['info'])) ok('docker');
else warn('docker không chạy / chưa cài — pnpm db:up sẽ lỗi (Postgres local)');

console.log('\nEnv files');
if (!existsSync(apiEnv)) {
  bad('thiếu apps/api/.env — copy .env.example rồi điền R2 từ skill cloudflare-r2');
} else {
  ok('apps/api/.env');
  const text = readFileSync(apiEnv, 'utf8');
  const need = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'R2_ACCOUNT_ID',
    'R2_BUCKET',
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_PUBLIC_BASE_URL',
    'R2_PRIVATE_BUCKET',
  ];
  for (const key of need) {
    const m = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
    let val = m?.[1]?.trim() ?? '';
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!val) bad(`${key} trống trong apps/api/.env`);
    else if (key === 'DATABASE_URL' && !val.startsWith('postgresql'))
      bad('DATABASE_URL phải postgresql://…');
    else if (key === 'R2_PUBLIC_BASE_URL' && val.includes('r2.dev'))
      warn(`${key} vẫn dùng r2.dev — nên là https://cdn.anhungland.com`);
    else if (key === 'R2_PUBLIC_BASE_URL' && val.includes('cdn.anhungland.com'))
      ok(`${key} (CDN)`);
    else ok(key);
  }
}

if (!existsSync(webEnv)) {
  if (existsSync(webExample)) {
    warn('thiếu apps/web/.env — sẽ gợi ý copy từ .env.example');
  } else bad('thiếu apps/web/.env và .env.example');
} else ok('apps/web/.env');

console.log('\nDocs gate');
for (const f of [
  'docs/FOUNDATION.md',
  'docs/PLAYBOOK.md',
  'docs/adr/0006-nextjs-web.md',
  'docs/adr/0005-cloudflare-r2.md',
  '.cursor/skills/cloudflare-r2/SKILL.md',
]) {
  if (existsSync(resolve(root, f))) ok(f);
  else bad(`thiếu ${f}`);
}

console.log('');
if (failed) {
  console.log(`Doctor: ${failed} lỗi — sửa trước khi code feature.`);
  process.exit(1);
}
console.log('Doctor: sẵn sàng foundation (xem docs/FOUNDATION.md cho mục Owner).');
process.exit(0);
