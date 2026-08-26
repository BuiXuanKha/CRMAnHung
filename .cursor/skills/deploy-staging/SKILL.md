---
name: deploy-staging
description: Deploy CRMAnHung to anhungland.com by merging to main (GitHub Actions auto-runs). Use when the user says deploy, đẩy lên server/VPS/staging, lên anhungland.com, or GitHub Action deploy.
---

# Deploy staging — CRMAnHung

Khi chủ sở hữu bảo **deploy** (sau khi sửa code xong), làm **đúng 2 bước agent** dưới. Push lên `main` thì GitHub Actions **tự** lên VPS — không nhờ chủ bấm Run workflow, không rsync từ máy agent (trừ khi Action gãy và họ đồng ý đường dự phòng).

Site mới: **https://anhungland.com**  
**Cấm** đụng `crm.anhungland.com`, `/var/www/anhungland-crm`, PM2 `anhungland-api`.

Chi tiết: `docs/DEPLOYMENT.md`. Workflow: `.github/workflows/deploy-staging.yml`.

## Quy trình (bắt buộc)

```
① Nhánh abc (cursor/…) — sửa, commit, push
    ↓ chủ bảo deploy / đã ổn
①b Kiểm tra nhánh/PR cũ chưa merge → **hỏi chủ** có gộp trước không
    ↓ chủ trả lời (hoặc đã chỉ đích danh nhánh merge)
② Gộp abc vào main
    ↓ GitHub tự chạy
③ Actions Deploy CRMAnHung (staging) trên commit main mới
```

### ① Nhánh đang làm

- Commit + push trên nhánh feature (`cursor/<ten>-2b02`).
- Không sửa trực tiếp trên VPS.
- Push nhánh `abc` **không** lên server.

### ①b Kiểm tra nhánh trước chưa merge (**bắt buộc trước khi merge**)

**Trước** khi merge nhánh đang làm (`abc`) hoặc bất kỳ PR nào vào `main`, agent **phải** rà soát xem còn nhánh/PR cũ chưa gộp không.

**Cách kiểm tra (chạy thật, không đoán):**

```bash
git fetch origin main
# Nhánh cursor/* có commit chưa nằm trong main
git branch -r --no-merged origin/main | rg 'origin/cursor/' || true
# PR mở trỏ main (ưu tiên draft + open)
gh pr list --base main --state open --limit 20
```

Liệt kê ngắn gọn cho chủ: **PR #**, **nhánh**, **tiêu đề**, **draft/open** — bỏ qua PR đã superseded hoặc nhánh trùng commit với nhánh đang deploy.

**Bắt buộc hỏi lại chủ** nếu tìm thấy ≥1 nhánh/PR còn commit chưa merge (trừ nhánh đang được yêu cầu merge):

> Trước khi merge/deploy **`abc`**, còn các nhánh/PR chưa gộp vào `main`:
> - PR #… — `cursor/…` — …
>
> Bạn có muốn **merge nhanh** (các) nhánh trên **trước**, hay chỉ merge **`abc`** rồi deploy?

**Quy tắc:**

- **Không** tự merge/deploy nhánh đang làm khi còn nhánh cũ chưa merge mà **chưa hỏi** và **chưa có câu trả lời** của chủ.
- Chủ trả lời *«chỉ merge abc»* / *«merge #107 trước»* / *«gộp hết rồi deploy»* → làm đúng thứ tự đã chốt.
- Chủ đã **chỉ đích danh** PR/nhánh cần merge trong tin nhắn hiện tại (vd. *«merge #107»*) → vẫn **nhắc** nhánh còn lại nếu có, nhưng không chặn lệnh đích danh đó.
- Không có nhánh cũ nào → báo *«không còn PR/nhánh cursor chưa merge»* rồi tiếp tục merge.

### ② Gộp vào `main` (đây là “bấm deploy”)

- PR **vào `main`** rồi merge (hoặc fast-forward `main` tới tip nhánh đã review).
- Không gộp nhầm PR đang trỏ nhánh `cursor` cha.
- Sau merge: `main` = bản lên VPS. Có thể xoá nhánh `abc`. **Không xoá `main`.**
- Agent **không** `gh workflow run` (token chỉ đọc). Không cần — `push` lên `main` đã trigger workflow.

### ③ Theo dõi Actions (không nhờ chủ bấm)

- URL: https://github.com/BuiXuanKha/CRMAnHung/actions/workflows/deploy-staging.yml
- `gh run list --workflow=deploy-staging.yml --branch main --limit 1`
- Chờ job xong; nếu không tự chạy: nhờ chủ **Run workflow** một lần (dự phòng `workflow_dispatch`).
- **Chỉ `main` lên VPS.** Không deploy nhánh đang làm dở.

Job xanh ≈ `rsync` (giữ `.env`) + `scripts/remote_deploy.sh`.

### Kiểm tra sau job

- Job Actions xanh
- `https://anhungland.com/api/v1/health` → 200
- `https://anhungland.com/` và `/khach-hang` → 200
- `https://crm.anhungland.com` vẫn 200 (không đổi)

## Rollback

Revert (hoặc reset có kiểm soát) trên `main` rồi **push** — Actions chạy lại. Migration Prisma **không** tự hoàn tác. Có thể Run workflow tay trên commit cũ.

## Secrets (đã gắn — không hỏi lại)

Repo → Settings → Secrets and variables → Actions:

| Secret | Ý nghĩa |
|--------|---------|
| `DEPLOY_SSH_HOST` | VPS `103.15.51.19` |
| `DEPLOY_SSH_KEY` | Private key user `deploy` |

Không dán private key / mật khẩu root vào chat. Không commit `.env`.

## Cấm

- Merge/deploy **mà không** chạy bước ①b và **không hỏi** khi còn nhánh/PR cũ chưa merge
- Rsync/`remote_deploy.sh` từ agent làm đường mặc định
- Deploy nhánh khác `main`
- Đụng CRM cũ / port 5000 / cây `anhungland-crm`
- Ghi đè `.env` trên server
- `gh secret set` / `gh workflow run` khi token chỉ đọc
- Nhờ chủ bấm Run workflow **khi merge `main` đã trigger được**

## Dự phòng (chỉ khi Action gãy)

Agent SSH user `deploy` + rsync giống CI, **chỉ** khi chủ đồng ý. Vẫn không đụng CRM cũ.
