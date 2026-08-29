#!/usr/bin/env bash
# One-shot on VPS: SEO-copy published lot + project-address photos.
# Chat-sourced lot images: copy to lodats/; keep customers/chat/ originals.
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

echo "==> SEO copy dry-run SCOPE=published (lot + address; copy chat-sourced lot images, keep chat files)"
SCOPE=published pnpm images:seo-copy

echo "==> SEO copy APPLY SCOPE=published"
APPLY=1 SCOPE=published pnpm images:seo-copy

echo "==> Revalidate public listing HTML + sitemap"
chmod +x "${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/scripts/revalidate-public-listings.sh"
CRMANHUNG_ROOT="${CRMANHUNG_ROOT:-/var/www/crmanhung}" bash "${CRMANHUNG_ROOT}/repo/scripts/revalidate-public-listings.sh"
