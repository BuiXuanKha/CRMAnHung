#!/usr/bin/env bash
# One-shot on VPS: cover WebP → sibling ….og.jpg for social preview (Zalo/FB).
# Gallery WebP unchanged. Default: every CRM lot with a WebP cover.
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

SCOPE_ARG="${SCOPE:-all}"

echo "==> OG JPEG dry-run SCOPE=${SCOPE_ARG}"
SCOPE="${SCOPE_ARG}" pnpm images:og-jpg

echo "==> OG JPEG APPLY SCOPE=${SCOPE_ARG}"
APPLY=1 SCOPE="${SCOPE_ARG}" pnpm images:og-jpg

echo "==> Revalidate public listing HTML (og:image picks up ….og.jpg)"
chmod +x "${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/scripts/revalidate-public-listings.sh"
CRMANHUNG_ROOT="${CRMANHUNG_ROOT:-/var/www/crmanhung}" bash "${CRMANHUNG_ROOT}/repo/scripts/revalidate-public-listings.sh"
