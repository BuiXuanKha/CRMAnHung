#!/usr/bin/env bash
# One-shot: leftover PROJECT AddressImage UUID keys → {ten-du-an}-anh-n.
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

echo "==> SEO copy dry-run orphan project-address photos"
pnpm images:seo-copy-addresses

echo "==> SEO copy APPLY orphan project-address photos"
APPLY=1 pnpm images:seo-copy-addresses
