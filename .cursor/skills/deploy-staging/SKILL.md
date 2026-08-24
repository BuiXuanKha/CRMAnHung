---
name: deploy-staging
description: Deploy CRMAnHung to anhungland.com via GitHub Actions from main. Use when the user says deploy, đẩy lên server/VPS/staging, lên anhungland.com, or GitHub Action deploy.
---

# Deploy staging — CRMAnHung

Khi chủ sở hữu bảo **deploy** (sau khi sửa code xong), làm **đúng 3 bước** dưới. Không rsync từ máy agent trừ khi Action gãy và họ đồng ý đường dự phòng.

Site mới: **https://anhungland.com**  
**Cấm** đụng `crm.anhungland.com`, `/var/www/anhungland-crm`, PM2 `anhungland-api`.

Chi tiết server: `docs/DEPLOYMENT.md`. Workflow: `.github/workflows/deploy-staging.yml`.

## Quy trình (bắt buộc)

```
① Nhánh abc (cursor/…) — sửa, commit, push
    ↓ ổn
② Gộp abc vào main
    ↓
③ Actions: Deploy CRMAnHung (staging) — Run workflow, chọn main
```

### ① Nhánh đang làm

- Commit + push trên nhánh feature (`cursor/<ten>-2b02`).
- Không sửa trực tiếp trên VPS.

### ② Gộp vào `main`

- PR **vào `main`** (không gộp nhầm PR đang trỏ nhánh `cursor` cha).
- Gộp xong: `main` = bản sắp lên VPS.
- Có thể xoá nhánh `abc` sau khi đã trên `main`. **Không xoá `main`.**

### ③ GitHub Actions

- URL: https://github.com/BuiXuanKha/CRMAnHung/actions/workflows/deploy-staging.yml
- **Run workflow** → **Use workflow from = `main`** → **Run workflow**.
- Agent **không** `gh workflow run` (GitHub CLI chỉ đọc / 403). Nhờ chủ bấm nút; đưa đúng URL.
- **Chỉ deploy `main`.** Không Run workflow trên nhánh đang làm dở.
- Không auto-deploy mỗi lần push.

Job xanh ≈ `rsync` (giữ `.env`) + `scripts/remote_deploy.sh` (pnpm, Prisma migrate, build, `pm2 restart crmanhung-api` + `crmanhung-web`).

### Kiểm tra sau job

- Job Actions xanh
- `https://anhungland.com/api/v1/health` → 200
- `https://anhungland.com/` và `/khach-hang` → 200
- `https://crm.anhungland.com` vẫn 200 (không đổi)

## Rollback

Chạy lại workflow trên **commit `main` cũ** (hoặc revert rồi Run workflow). Migration Prisma **không** tự hoàn tác.

## Secrets (đã gắn — không hỏi lại)

Repo → Settings → Secrets and variables → Actions (không phải Deploy keys, không phải SSH keys tài khoản):

| Secret | Ý nghĩa |
|--------|---------|
| `DEPLOY_SSH_HOST` | VPS `103.15.51.19` |
| `DEPLOY_SSH_KEY` | Private key user `deploy` |

Không dán private key / mật khẩu root vào chat. Không commit `.env`.

## Cấm

- Rsync/`remote_deploy.sh` từ agent làm đường mặc định
- Deploy nhánh khác `main`
- Đụng CRM cũ / port 5000 / cây `anhungland-crm`
- Ghi đè `.env` trên server
- `gh secret set` / `gh workflow run` khi token chỉ đọc

## Dự phòng (chỉ khi Action gãy)

Agent SSH user `deploy` + rsync giống CI, **chỉ** khi chủ đồng ý. Vẫn không đụng CRM cũ.
