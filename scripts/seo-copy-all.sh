#!/usr/bin/env bash
# One-shot on VPS: move ALL CRM lot + project-address photos to SEO keys.
# Does not touch customers/chat/. Idempotent (published lots already moved).
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

echo "==> SEO copy dry-run SCOPE=all (lot + address, skip chat)"
SCOPE=all pnpm images:seo-copy

echo "==> SEO copy APPLY SCOPE=all"
APPLY=1 SCOPE=all pnpm images:seo-copy
