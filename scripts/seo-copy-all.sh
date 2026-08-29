#!/usr/bin/env bash
# One-shot: SEO-copy ALL CRM lot + project-address photos.
# Chat-sourced lot images: copy to lodats/ SEO key; keep customers/chat/ originals.
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

echo "==> SEO copy dry-run SCOPE=all (lot + address; copy chat-sourced lot images, keep chat files)"
SCOPE=all pnpm images:seo-copy

echo "==> SEO copy APPLY SCOPE=all"
APPLY=1 SCOPE=all pnpm images:seo-copy
