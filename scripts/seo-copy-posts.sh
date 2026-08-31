#!/usr/bin/env bash
# One-shot: CMS post cover + TipTap UUID → {slug-tieu-de}-anh-n.webp + rewrite DB URLs.
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

echo "==> SEO copy post images dry-run"
pnpm images:seo-copy-posts

echo "==> SEO copy post images APPLY"
APPLY=1 pnpm images:seo-copy-posts

echo "==> Revalidate public listing + post HTML"
chmod +x "${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/scripts/revalidate-public-listings.sh"
CRMANHUNG_ROOT="${CRMANHUNG_ROOT:-/var/www/crmanhung}" bash "${CRMANHUNG_ROOT}/repo/scripts/revalidate-public-listings.sh"
