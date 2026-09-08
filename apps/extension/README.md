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

**Thông tin quét (v2.15.0):** một hàng avatar tròn + tên Facebook; bên dưới: Nguồn, Kênh NV (`Page {uid}` / `Profile {uid}`), UID khách, Link cuộc chat (rút gọn trên panel, URL đầy đủ khi Copy). Trường debug (`asset_id`, Lightspeed…) chỉ nằm trong **Copy thông tin quét**.

Ingest (v2.14.0+): **bắt buộc UID Facebook khách**. Messenger E2EE chưa hiện UID thì không gửi lên CRM.

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

**Owner 2026-09-08 — bỏ qua BUG-043.** Extension vẫn gửi tin không ID bong bóng (`collectOrphanBubbleMessages`, `orphan::`). **API (BUG-044) không ghi** những tin đó. Không cấm gửi `orphan::`, không unique `(facebook, mid)` trừ khi owner mở lại.

**Owner 2026-09-08 — chat nhóm Messenger (làm sau, chưa sửa).** An Hưng **có** hội thoại nhóm (ba người trở lên) trên Messenger, nhưng **ít**. Hiện máy chỉ đúng với chat **từng người**: Messenger thường lấy số trên URL `/messages/t/{số}` vừa làm mã cuộc chat vừa làm UID khách. Chat nhóm thì số đó **không** phải UID một người; nếu NV bật quét trên nhóm, CRM có thể tạo Person mang mã nhóm. Lúc làm đợt extension: nhận diện nhóm rồi **không** gán `customerUid` = mã nhóm; thiếu UID người thì không POST (cùng quy tắc BUG-013). Chỗ code: `ext-context-facebook-com.js` `resolveCustomerUid`, `content-inbox.js` (gán UID = `threadId` khi Messenger thường). Domain: `docs/domains/facebook-source.md` §13.1.
