#!/usr/bin/env bash
# One-shot: rewrite PublicLotListing slugs (no 80-char cap, no repeated address).
# Writes 301s + revalidates. Does not rename CDN image keys.
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

echo "==> Public lot slugs dry-run"
pnpm exec tsx scripts/regenerate-public-lot-slugs.ts

echo "==> Public lot slugs APPLY"
APPLY=1 pnpm exec tsx scripts/regenerate-public-lot-slugs.ts
