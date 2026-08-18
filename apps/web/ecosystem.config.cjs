/**
 * PM2 — Next.js Web (CRMAnHung) trên Mắt Bão.
 * Port 5001 — nginx proxy `/` tới process này.
 * Không đụng anhungland static web của hệ cũ.
 */
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
      },
    },
  ],
};
