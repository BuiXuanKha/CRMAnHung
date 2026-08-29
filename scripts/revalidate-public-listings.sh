#!/usr/bin/env bash
# Refresh Next ISR for public listings + sitemap (loopback). Run on VPS after
# R2/DB image keys change without an admin Đăng/Gỡ.
set -euo pipefail

API="${CRMANHUNG_ROOT:-/var/www/crmanhung}/repo/apps/api"
cd "$API"

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
posts = json.load(urllib.request.urlopen("http://127.0.0.1:5050/api/v1/public/posts"))
base = "/mua-ban-nha-dat-huyen-nam-sach"
paths = ["/", base, "/sitemap.xml"] + [
    f"{base}/{it['slug']}" for it in listings.get("items", [])
]
cats = set()
for it in posts.get("items", []):
    cat = it.get("category") or ""
    slug = it.get("slug") or ""
    if cat:
        cats.add(f"/{cat}")
    if cat and slug:
        paths.append(f"/{cat}/{slug}")
paths.extend(sorted(cats))
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
