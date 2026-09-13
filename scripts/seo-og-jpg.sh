#!/usr/bin/env bash
# One-shot on VPS: cover WebP → sibling ….og.png (1200×630) for social preview.
# Gallery WebP unchanged.
#
# Optional env (set by Actions step or manually):
#   SCOPE=published|all   (default all)
#   SLUGS=a,b,c           only these listing slugs
#   LIMIT=N
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

SCOPE_ARG="${SCOPE:-all}"
export SCOPE="$SCOPE_ARG"
export SLUGS="${SLUGS:-}"
export LIMIT="${LIMIT:-}"
export FORCE="${FORCE:-1}"

echo "==> OG PNG dry-run SCOPE=${SCOPE_ARG} SLUGS=${SLUGS:-all} LIMIT=${LIMIT:-none}"
pnpm images:og-jpg

echo "==> OG PNG APPLY FORCE=${FORCE}"
APPLY=1 FORCE="${FORCE}" pnpm images:og-jpg

echo "==> Revalidate public listing HTML (og:image → ….og.png)"
chmod +x "${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/scripts/revalidate-public-listings.sh"
CRMANHUNG_ROOT="${CRMANHUNG_ROOT:-/var/www/crmanhung}" bash "${CRMANHUNG_ROOT}/repo/scripts/revalidate-public-listings.sh"
