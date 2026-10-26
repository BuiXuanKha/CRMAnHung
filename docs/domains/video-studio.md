# Domain: AI Video Studio (AnHungLand)

- **Slug:** `video-studio`
- **Status:** **API slice 1** — mobile UI nối API (upload, GPT lời đọc, xuất ElevenLabs + Creatomate)
- **Liên quan:** [`lodats.md`](./lodats.md) §12.3 (chi tiết lô) · [`public-content.md`](./public-content.md) (marketing)
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.5 (mobile trước)
- **Route dự kiến:** `/lo-dat/[lodatId]/video` (+ nested steps, xem §12)

Pipeline tổng (OpenAI · ElevenLabs · Creatomate · R2 · job async): xem bản thiết kế đã bàn với owner — **không lặp chi tiết kỹ thuật ở đây**; doc này tập trung **màn hình mobile** và luồng NV.

---

## 1. Mục đích

Nhân viên tạo **video BĐS dọc 9:16 (MP4)** từ video thô theo **cảnh**, gắn **một lô đất** (`Lodat`), biên tập lời đọc AI, duyệt từng cảnh, xuất file tải về / chia sẻ.

## 2. Actors

| Actor | Được | Không |
|-------|------|--------|
| **STAFF** | Mở studio từ lô **mình** (`createdBy` / ownership giống GET `/lodats/:id`); tạo/sửa/duyệt/xuất | Studio từ lô NV khác |
| **ADMIN** | **Slice 1:** CrmAlert «Chức năng dành cho nhân viên» (giống AI GPT bài đăng) | Tạo video thay NV (chưa bàn) |

## 3. Khái niệm

| Thuật ngữ | Nghĩa |
|-----------|--------|
| **Dự án video** | `VideoProject` — 1 lô, 1 NV, nhiều cảnh |
| **Cảnh** | Một đoạn nội dung (lô, tiện ích, trường, chợ…) + clip thô + lời đọc |
| **Duyệt cảnh** | NV xác nhận lời đọc + clip chọn trước khi ghép tổng |

**Cảnh mặc định (5):** `PROPERTY_HERO` · `PROPERTY_DETAIL` · `LOCATION_CONTEXT` · `VALUE_PROPOSITION` · `CALL_TO_ACTION`.

**Cảnh thêm (preset):** `POI_UTILITY` · `POI_SCHOOL` · `POI_MARKET` · `POI_HOSPITAL` · `POI_TRANSPORT` · `POI_CUSTOM` (nhãn tự nhập). Tối đa **12** cảnh / dự án (chốt mock).

## 4. Use case chính

1. **Tạo video từ lô** — Chi tiết lô → **Tạo video** → studio (prefill tiêu đề/địa chỉ từ `LodatDetail`).
2. **Upload clip thô** — Từng cảnh, gallery/camera (mobile).
3. **Phân tích AI** — Async; xem transcript + gợi ý đoạn đẹp + draft lời đọc.
4. **Sửa & duyệt** — Sửa text; thay clip; kéo thứ tự cảnh; duyệt từng cảnh.
5. **Xem trước & xuất** — Preview tổng → render MP4 9:16 → tải về.

## 5. Entry — chi tiết lô `/lo-dat/[id]`

Cập nhật [`lodats.md`](./lodats.md) §12.3.2 — bổ sung **Tạo video** (slice Video Studio).

### 5.1 Mobile (ưu tiên slice 1)

**Owner chốt 2026-10-26:** CTA **nổi trong content** + mục **Tạo video** trong FAB «⋯» (cùng route).

1. **Khối CTA trong content** (sau khối thông số/chủ, **trước** Lịch sử giao dịch):
   - Nút full-width secondary: icon **Clapperboard** (Lucide) + chữ **Tạo video**.
   - Bấm → `/lo-dat/[id]/video` (push; lưu scroll chi tiết như điều hướng khác).
2. **FAB «⋯»** — thêm menuitem **Tạo video** (cùng route), đặt **dưới AI GPT**.
3. **ADMIN** bấm → CrmAlert (không vào studio).

Ví dụ lô live: `https://anhungland.com/lo-dat/cmtvcr8ck0056jx7txig8ck6m` → **Tạo video** → `/lo-dat/cmtvcr8ck0056jx7txig8ck6m/video`.

### 5.2 Máy tính (slice sau mobile)

Chưa làm UI desktop slice 1. Tạm: cùng nút **Tạo video** trong hàng `ld-detail-desktop-actions` (cạnh Soạn bài / AI GPT) hoặc ẩn đến slice desktop — **mock mobile trước**.

---

## 12. Màn hình — thứ tự: mobile trước

### 12.1 Giao diện máy tính

**Chưa slice 1.** Placeholder: layout 2 cột (timeline trái, editor phải) — làm sau khi mobile ổn.

---

### 12.2 Giao diện mobile (slice 1 — UI mock)

Safe area đáy; header CRM shell (menu trái). Không full-bleed che header.

#### 12.2.1 Luồng màn

```
/lo-dat/[id]/video           Studio hub (timeline cảnh)
/lo-dat/[id]/video/scene/[sceneId]   Chi tiết 1 cảnh
/lo-dat/[id]/video/preview     Xem trước tổng
/lo-dat/[id]/video/export      Trạng thái xuất + tải MP4
```

#### 12.2.2 Studio hub — `/lo-dat/[id]/video`

**Header trang**

1. Nút **Quay lại** (←) → `/lo-dat/[id]` (`scroll={false}` + nhớ scroll detail nếu đã có).
2. Tiêu đề: **Video AI** (1 dòng).
3. Phụ đề rút gọn: `{lodat.title}` — truncate 1 dòng.

**Thanh trạng thái dự án**

4. Chip trạng thái: **Nháp** · **Đang xử lý** · **Sẵn sàng xuất** · **Hoàn thành** (mock có thể cố định Nháp).

**Danh sách cảnh (vertical, reorder)**

5. Mỗi **thẻ cảnh** (full width, khoảng cách 12px):
   - Trái: thumbnail 9:16 nhỏ (56×100) hoặc placeholder xám + icon cảnh.
   - Giữa: tên cảnh (tiếng Việt) + 1 dòng phụ (vd. «Chưa có video» / «Đã duyệt»).
   - Phải: icon **⋮⋮** kéo thứ tự (touch) + chevron **›** vào chi tiết.
6. Thứ tự mặc định = 5 cảnh §3 (khi tạo dự án lần đầu).
7. Nút **+ Thêm cảnh** (ghost, full width) → bottom sheet chọn preset POI §3.

**Sticky footer**

8. **Xem trước** (secondary) — enabled khi ≥1 cảnh có clip (mock: luôn enabled).
9. **Xuất video** (primary) — `/video/export`; disabled + hint nếu chưa đủ cảnh duyệt (mock: rule hiển thị only).

#### 12.2.3 Chi tiết cảnh — `/lo-dat/[id]/video/scene/[sceneId]`

1. Header: **Quay lại** hub + tên cảnh.
2. **Vùng upload video thô**
   - Chưa có file: zone «Chọn video» (input file `accept=video/*`, capture camcorder mobile nếu trình duyệt hỗ trợ).
   - Có file: preview 9:16, nút **Thay video**.
3. **Trạng thai phân tích** (mock static): «Phân tích AI — sẽ nối API sau» hoặc skeleton.
4. **Lời đọc** — `textarea` nhiều dòng, label «Lời thuyết minh»; nút **Tạo lại từ AI** (disabled mock / toast «Sắp có»).
5. **Đoạn quay gợi ý** (mock): 2 dòng text «AI chọn đoạn đẹp — preview timeline sau».
6. Footer sticky: **Duyệt cảnh** (primary) → toast + quay hub; trạng thái cảnh = đã duyệt (local/mock state).

#### 12.2.4 Xem trước — `/lo-dat/[id]/video/preview`

1. Player 9:16 giữa màn (mock: poster + nút play giả).
2. Danh sách cảnh đã duyệt (read-only, thứ tự).
3. Footer: **Quay lại chỉnh** · **Xuất video**.

#### 12.2.5 Xuất — `/lo-dat/[id]/video/export`

1. Progress (mock spinner).
2. Xong: nút **Tải MP4** + **Quay về lô**.
3. Ghi chú: «Video 9:16, không âm thanh gốc, giọng AI».

---

### 12.3 Dữ liệu

- `GET /api/v1/video-projects/lodat/:lodatId` — get hoặc tạo dự án + 5 cảnh mặc định.
- Upload video thô → R2 private; xuất → GPT (lời) · ElevenLabs (TTS) · Creatomate (MP4) → R2 public `video-exports/`.

---

## 13. Secrets (server)

- `ELEVENLABS_API_KEY` — `apps/api/.env` (gitignored); mẫu `apps/api/.env.example`. **Không** ghi key vào docs/git.
- Production VPS: thêm cùng biến vào env deploy CRMAnHung (skill `deploy-staging` / `DEPLOYMENT.md`), không commit.

## 14. API dự kiến (slice sau — không mock)

Prefix `/api/v1/video-projects` · ownership `lodatId` + JWT STAFF. Contract Zod trong `packages/shared` trước khi nối.

---

## 15. Lịch slice

| # | Việc | Trạng thái |
|---|------|------------|
| 1 | Doc này + nút entry §5 | **Ready for mock** |
| 2 | UI mock mobile §12.2 + route Next `(crm)/lo-dat/[id]/video/*` | Tiếp theo |
| 3 | Contract + API + jobs | Sau mock owner duyệt |

---

## 16. Câu hỏi mở (không chặn mock UI)

1. Một lô nhiều dự án video hay chỉ **1 dự án active**?
2. Giọng ElevenLabs: một preset công ty hay NV chọn?
3. Template Creatomate: ai cung cấp asset intro/outro?

Mock slice 1: **1 dự án mới mỗi lần bấm Tạo video** (hoặc resume nếu đã có draft — làm sau).
