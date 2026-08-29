#!/usr/bin/env bash
# One-shot: post / listing TipTap public-web JPEG/PNG → WebP + rewrite DB URLs.
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

echo "==> WebP public-web media dry-run"
pnpm images:webp-public-media

echo "==> WebP public-web media APPLY"
APPLY=1 pnpm images:webp-public-media

echo "==> Revalidate public listing + post HTML"
chmod +x "${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/scripts/revalidate-public-listings.sh"
CRMANHUNG_ROOT="${CRMANHUNG_ROOT:-/var/www/crmanhung}" bash "${CRMANHUNG_ROOT}/repo/scripts/revalidate-public-listings.sh"
