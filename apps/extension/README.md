# An Hưng Land CRM Extension

Chrome MV3 — quét khách + tin từ Meta Inbox / Messenger, gửi vào **CRM mới** (`anhungland.com`).

Đây là scanner đang dùng (cùng file với thư mục `AnhunglandExtension` trên máy), đặt trong repo CRMAnHung.

**Không** Load unpacked thư mục Downloads zip nữa. Dùng thư mục này.

## Cài đặt

1. Gỡ bản cũ **Anhungland Extension** trên `chrome://extensions` (nếu còn).
2. Bật Developer mode → **Load unpacked** → chọn thư mục có `manifest.json`:

   `crmanhung/apps/extension`

   Hoặc giải nén zip bản phát hành rồi chọn thư mục đó.

3. Icon extension / Options: API URL mặc định `https://anhungland.com/api/v1`. Dev: `http://localhost:5050/api/v1`.
4. Mở Business Suite Inbox hoặc Messenger → panel: đăng nhập `kha` / Admin → **Bật quét** → đổi hội thoại để gửi (hoặc **Dừng** để gửi khách đang mở).
5. Sửa file xong: Reload extension, refresh tab Meta.

**Thông tin quét:** nút **Copy thông tin quét** copy các trường panel (UID, thread, tên, …) để dán gửi dev. Bản tin nhắn vẫn dùng nút Copy ở mục tin.

## Nguồn

| Nguồn | URL |
|-------|-----|
| Business Suite | `business.facebook.com/latest/inbox` |
| Messenger thường | `/messages/t/…` |
| Messenger E2EE | `/messages/e2ee/t/…` |

## API (CRMAnHung)

Base = API URL (có `/api/v1`):

| | |
|--|--|
| `POST /auth/login` | access + refresh JWT |
| `POST /auth/refresh` | đổi access khi hết hạn |
| `GET /auth/me` | kiểm tra phiên |
| `POST /customers/from-extension` | draft quét |

Không gửi lên `crm.anhungland.com`.

## Ghi chú

- Dump DOM / nút Quét DOM LIVE chỉ tải file máy — không commit dump.

## Khi làm lại / sửa extension (để bàn)

**Owner 2026-09-06 — chưa sửa scanner.** Extension vẫn gửi tin không ID bong bóng (`collectOrphanBubbleMessages`, `orphan::`). **API (BUG-044) không ghi** những tin đó; migrate xóa hàng cũ trên DB. Lúc làm đợt extension: đừng gửi bubble thiếu `mid.$` / `@msgr.`. Chi tiết: `docs/audit/BUGS.md` **BUG-043** / **BUG-044**.
