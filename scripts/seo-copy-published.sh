#!/usr/bin/env bash
# One-shot on VPS: move published lot + project-address photos to SEO keys.
# Does not touch customers/chat/. Idempotent.
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

echo "==> SEO copy dry-run SCOPE=published (lot + address, skip chat)"
SCOPE=published pnpm images:seo-copy

echo "==> SEO copy APPLY SCOPE=published"
APPLY=1 SCOPE=published pnpm images:seo-copy

echo "==> Revalidate public listing HTML"
python3 - <<'PY'
import json, re, urllib.error, urllib.request

secret = ""
try:
    text = open(".env", encoding="utf-8").read()
    m = re.search(r"^REVALIDATE_SECRET=(.*)$", text, re.M)
    if m:
        secret = m.group(1).strip().strip("'").strip('"')
except OSError:
    secret = ""
if not secret:
    print("skip revalidate: no REVALIDATE_SECRET")
    raise SystemExit(0)

listings = json.load(urllib.request.urlopen("http://127.0.0.1:5050/api/v1/public/listings"))
base = "/mua-ban-nha-dat-huyen-nam-sach"
paths = ["/", base, "/sitemap.xml"] + [
    f"{base}/{it['slug']}" for it in listings.get("items", [])
]
req = urllib.request.Request(
    "http://127.0.0.1:5001/api/revalidate",
    data=json.dumps({"paths": paths}).encode(),
    headers={"Content-Type": "application/json", "x-revalidate-secret": secret},
    method="POST",
)
try:
    with urllib.request.urlopen(req) as res:
        print(res.read().decode()[:800])
except urllib.error.HTTPError as err:
    print("revalidate HTTP", err.code, err.read()[:300])
PY
