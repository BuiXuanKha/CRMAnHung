#!/usr/bin/env bash
# One-shot: leftover public JPEG/PNG → WebP, retarget DB, delete source only after verify.
# Does not touch private bucket (title-service documents).
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

echo "==> WebP replace public JPEG/PNG dry-run"
pnpm images:webp-replace

echo "==> WebP replace APPLY"
APPLY=1 pnpm images:webp-replace

echo "==> Revalidate public listing + post HTML"
chmod +x "${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/scripts/revalidate-public-listings.sh"
CRMANHUNG_ROOT="${CRMANHUNG_ROOT:-/var/www/crmanhung}" bash "${CRMANHUNG_ROOT}/repo/scripts/revalidate-public-listings.sh"
