# Tổng quan Extension — Anhungland Extension

Tài liệu kỹ thuật cho lập trình viên, dựa trên source trong `AnhunglandExtension/`.

| | |
|---|---|
| **Ngày khảo sát** | 16/07/2026 |
| **Branch khảo sát** | `main` (sau cleanup dump) |
| **Manifest version** | `2.11.0` (`manifest.json`) |
| **Loại** | Chrome Extension Manifest V3 |

---

## 1. Extension dùng để làm gì

Chạy trên trang Meta, **quét khách + tin nhắn đang mở**, hiển thị panel nổi, đăng nhập JWT CRM, và **tự gửi draft khách** lên Backend khi đổi hội thoại.

Nguồn hỗ trợ (theo `manifest.json` + `ext-source.js`):

| Nguồn | URL match | Mã nguồn |
|-------|-----------|----------|
| Meta Business Suite Inbox | `business.facebook.com/latest/inbox` | `business_suite` |
| Messenger thường | `facebook.com` / `web.facebook.com` → `/messages/t/*` | `messenger_standard` |
| Messenger E2EE | `…/messages/e2ee/t/*` | `messenger_e2ee` |

Production CRM API mặc định: `https://anhungland.com/api/v1` (và localhost:5050 khi dev).

---

## 2. Cấu trúc runtime (sau khi dọn dump)

Chỉ giữ **file chạy extension**. Dump DOM / script phân tích offline **không** thuộc runtime và không commit vào repo.

```
AnhunglandExtension/
├── manifest.json                 # MV3, content_scripts, host_permissions
├── background.js                 # Service worker — proxy fetch API
├── config.js                     # Default URL, storage keys, version label
├── options.html / options.js     # Popup / trang cài đặt API URL
├── content-inbox.js              # Orchestrator + panel UI + gửi BE
├── ext-source.js                 # detectAnhunglandSource()
├── ext-person-name.js            # Chuẩn hoá / lọc tên đa ngôn ngữ
├── ext-context-business-suite.js # Read URL/DOM context Business Suite
├── ext-context-facebook-com.js   # Context Messenger standard / E2EE
├── scanners/
│   └── scanner-messenger-web.js  # Quét tên/tin trên Messenger web
├── README.md
└── docs/
    ├── README.md
    └── tech/extension-overview.md
```

---

## 3. Manifest & quyền

Nguồn: `manifest.json`.

| Hạng mục | Giá trị |
|----------|---------|
| `manifest_version` | `3` |
| `version` | `2.11.0` (single source of truth — JS đọc qua `chrome.runtime.getManifest()`) |
| Permissions | `activeTab`, `storage` |
| Background | `background.js` (service worker) |
| UI cài đặt | `options.html` (popup `action` + `options_ui` mở tab) |

**host_permissions**

- `https://business.facebook.com/*`
- `https://www.facebook.com/*`, `https://web.facebook.com/*`
- `https://anhungland.com/*`
- `http://localhost:5050/*`, `http://127.0.0.1:5050/*`
- Optional: `http://*/*`, `https://*/*` (mở rộng API URL tùy chỉnh)

**content_scripts**

1. **Business Suite** — inject:
   `config.js` → `ext-source.js` → `ext-person-name.js` → `ext-context-business-suite.js` → `content-inbox.js`
2. **Messenger web** — inject thêm `ext-context-facebook-com.js` + `scanners/scanner-messenger-web.js` trước `content-inbox.js`

---

## 4. Luồng hoạt động tổng quát

```
Trang Meta khớp match
  → inject context + (scanner nếu Messenger)
  → content-inbox.js tạo panel #anhungland-ext-panel
  → User bật quét / đổi hội thoại
  → Đọc UID, tên, avatar, tin nhắn từ DOM/URL
  → (Nếu đã login) khi chuyển khách: POST /customers/from-extension
  → CRM Web đọc khách đã lưu
```

`background.js` nhận message `ANHUNGLAND_EXT_API_FETCH` (và type legacy `FACEBOOK_CRM_API_FETCH`) để `fetch` API từ service worker — tránh CORS hạn chế của trang Facebook.

---

## 5. File quan trọng

### 5.1. `config.js`

| Hằng | Ý nghĩa |
|------|---------|
| `CRM_DEFAULT_API_URL` | `http://localhost:5000` |
| `CRM_DEFAULT_WEB_URL` | `http://localhost:5001` |
| `BACKEND_URL_STORAGE_KEY` | `anhungland_ext_api_url` |
| `AUTH_TOKEN_STORAGE_KEY` | `anhungland_ext_jwt` |
| `AUTH_USER_STORAGE_KEY` | `anhungland_ext_user` |
| Legacy keys | `pages_facebook_customer_crm_*` — migrate đọc một lần |
| `CRM_EXTENSION_UI_LABEL` | `v{version}-ai-icon` — chip trên panel |

### 5.2. Context adapters

Cả hai gắn `window.__ANHUNGLAND_EXT_CONTEXT__` (content-inbox cũng chấp nhận legacy `__PAGES_FB_CRM_EXT_CONTEXT__`).

**Business Suite** (`ext-context-business-suite.js`)

- `source: "business_suite"`
- URL params: `asset_id`, `mailbox_id`, `business_id`, `page_id`, `selected_item_id`, …
- `resolveCustomerUid()` ← `selected_item_id`
- `resolveMyPageUid()` ← `page_id` (khác asset Business)

**Messenger** (`ext-context-facebook-com.js`)

- `source` getter: `messenger_standard` | `messenger_e2ee`
- Thread từ pathname `/messages/t/{id}` hoặc `/messages/e2ee/t/{id}`
- E2EE: suy UID khách từ prefix `data-message-id` dạng `{uid}@msgr.…`
- `resolveEmployeeUid()` từ HTML/JSON nhúng trang

### 5.3. `scanners/scanner-messenger-web.js`

Export `window.__ANHUNGLAND_MESSENGER_SCANNER__` với `scan`, `collectMessages`, …

- Lọc vùng chat (không lấy list trái / sidebar phải)
- Parse `aria-label` tin (VI/EN), ảnh, emoji
- Phân biệt tin khách / page theo cấu trúc DOM + UID

### 5.4. `content-inbox.js` (orchestrator)

Trách nhiệm chính:

- Panel UI (collapse, sections: server, scan info, messages, DOM LIVE debug)
- Watch URL / đổi hội thoại (`WATCH_INTERVAL_MS = 1200`)
- Quét Business Suite bằng logic nội bộ; Messenger uỷ quyền scanner
- Đăng nhập: `POST /auth/login`, kiểm tra `GET /auth/me`
- Auto-draft: snapshot khách hiện tại → khi đổi scan key → `POST /customers/from-extension`
- Chuẩn bị ảnh tin nhắn (`blob:` → data URL; giữ path `/img/imgsmessenger/…` nếu đã lưu server)
- Nút debug **Quét DOM LIVE**: tải file summary/full DOM về máy (phục vụ dev) — **không** commit các file đó vào Git

Giới hạn quét tin: tối đa `MESSAGE_MAX_COUNT = 500`; cuộn chat để lấy thêm tin cũ.

### 5.5. `ext-person-name.js`

Helper tên đa ngôn ngữ (Latin/VN, Hán, Hangul, Kana…): normalize, độ dài tối thiểu, loại token ngắn không phải tên.

### 5.6. `options.html` / `options.js`

Lưu `anhungland_ext_api_url` vào `chrome.storage.local`. Version hiển thị lấy từ `CRM_EXTENSION_VERSION` (manifest).

---

## 6. API Backend mà Extension gọi

Qua `backendFetch` → message background → `fetch`.

| Method | Path | Khi nào |
|--------|------|---------|
| `POST` | `/auth/login` | Đăng nhập trên panel |
| `GET` | `/auth/me` | Khôi phục / kiểm tra phiên JWT |
| `POST` | `/auth/refresh` | Gia hạn access token |
| `POST` | `/customers/from-extension` | Gửi draft quét (thủ công/auto khi đổi khách) |

Payload draft gồm object `scan` (UID, tên, page, source, thread…) + `chatMessages` (id, text, images, sender…). Chi tiết field do `buildExtensionDraftPayload()` trong `content-inbox.js` và handler BE `customers/from-extension`.

---

## 7. Storage

| Key | Nội dung |
|-----|----------|
| `anhungland_ext_api_url` | Base URL API |
| `anhungland_ext_jwt` | JWT sau login |
| `anhungland_ext_user` | User JSON |
| Legacy `pages_facebook_customer_crm_*` | Đọc để migrate bản cũ |

---

## 8. Cài đặt & phát triển

1. Chrome → `chrome://extensions` → Developer mode → **Load unpacked** → chọn thư mục `apps/extension/anhunglandextension`.
2. Mở Business Suite Inbox hoặc Messenger thread khớp URL trong manifest.
3. Icon extension / Options → đặt API URL (`http://localhost:5050/api/v1` hoặc `https://anhungland.com/api/v1`).
4. Trên panel: đăng nhập tài khoản CRM (cùng user Web), bật quét, mở hội thoại khách.
5. Sau mỗi lần sửa JS: **Reload** extension trên `chrome://extensions`, rồi refresh tab Meta.

Dev CRM Web thường chạy `:5001`; API `:5050` (`/api/v1`). Production: `anhungland.com`.

---

## 9. Dump DOM / artefact nghiên cứu

Trước đây repo có file dump lớn (`pages-fb-crm-live-dom-*`, `pages-fb-crm-e2ee-*`, `scripts/` phân tích offline). Các file đó:

- **Không** được load bởi `manifest.json`
- Có thể chứa nội dung chat thật → rủi ro privacy
- Đã **xoá khỏi repo**; pattern ignore trong root `.gitignore`

Nút **Quét DOM LIVE** trên panel vẫn có thể tạo file tải về máy local khi cần debug — chỉ dùng nội bộ, không commit.

---

## 10. File nên đọc đầu tiên

| # | File | Lý do |
|---|------|-------|
| 1 | `manifest.json` | Match URL, inject order, version |
| 2 | `config.js` | Keys, default URL |
| 3 | `ext-source.js` | Phân loại nguồn |
| 4 | `ext-context-business-suite.js` / `ext-context-facebook-com.js` | Context theo nền tảng |
| 5 | `scanners/scanner-messenger-web.js` | Quét Messenger |
| 6 | `content-inbox.js` | Panel, auth, auto-draft, Business Suite scan |
| 7 | `background.js` | Proxy API fetch |

---

## 11. Điểm ngoài phạm vi / lưu ý

- DOM Meta hay đổi → selector/aria có thể gãy; cần test lại trên inbox thật.
- Phân quyền chi tiết lưu khách nằm ở Backend (`API/`), không chỉ ở extension.
- Không có test tự động trong thư mục extension.
- `options.html` placeholder version có thể lệch cho đến khi `options.js` chạy (giá trị thật từ manifest).
