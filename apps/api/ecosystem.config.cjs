/**
 * PM2 — CRMAnHung API trên server Mắt Bão (staging / sau này production).
 *
 *   cd /var/www/crmanhung/repo/apps/api
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *
 * Không dùng chung name/port với anhungland-api (hệ cũ, port 5000).
 */
module.exports = {
  apps: [
    {
      name: 'crmanhung-api',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5050,
        HOST: '0.0.0.0',
      },
    },
  ],
};
