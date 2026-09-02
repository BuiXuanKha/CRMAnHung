/**
 * PM2 — Next.js Web (CRMAnHung) trên Mắt Bão.
 * Port 5001 — nginx proxy `/` tới process này.
 * Không đụng anhungland static web của hệ cũ.
 *
 * Loads `apps/web/.env` (server-only, rsync-excluded) for REVALIDATE_SECRET
 * and `apps/web/.env.production` for PUBLIC_SEO_INDEX (ISR revalidate).
 */
const fs = require('fs');
const path = require('path');

function loadEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = {
  ...loadEnvFile(path.join(__dirname, '.env.production')),
  ...loadEnvFile(path.join(__dirname, '.env')),
};

function pickEnv(keys) {
  const extra = {};
  for (const key of keys) {
    if (fileEnv[key]) extra[key] = fileEnv[key];
  }
  return extra;
}

module.exports = {
  apps: [
    {
      name: 'crmanhung-web',
      script: 'server.js',
      cwd: `${__dirname}/.next-build/standalone/apps/web`,
      user: 'deploy',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        HOSTNAME: '0.0.0.0',
        ...pickEnv([
          'REVALIDATE_SECRET',
          'PUBLIC_SEO_INDEX',
          'NEXT_PUBLIC_SEO_INDEX',
          'INTERNAL_API_ORIGIN',
        ]),
      },
    },
  ],
};
