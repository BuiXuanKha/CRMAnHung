-- Seed published CMS pages for empty guest categories (owner 2026-09-07).
-- Idempotent: skip if (category, slug) already exists.

INSERT INTO "PublicPost" (
  "id", "slug", "category", "status", "title", "coverImageUrl", "bodyHtml", "excerpt",
  "metaDescription", "authorLabel", "publishedAt", "createdAt", "updatedAt"
)
VALUES
(
  'seed_post_lien_he_an_hung_land',
  'lien-he-an-hung-land',
  'lien-he',
  'PUBLISHED',
  'Liên hệ An Hưng Land',
  NULL,
  $html$
<p>An Hưng Land hỗ trợ tư vấn mua bán nhà đất tại <strong>huyện Nam Sách, Hải Dương</strong>. Quý khách có thể gọi trực tiếp hoặc nhắn tin qua Facebook / Zalo theo số hotline.</p>
<h2>Hotline</h2>
<p><a href="tel:0977656280"><strong>0977.656.280</strong></a></p>
<h2>Địa chỉ văn phòng</h2>
<p>BT6.8 KĐT Tây Nam Sách, huyện Nam Sách, tỉnh Hải Dương.</p>
<h2>Giờ làm việc</h2>
<p>Thứ Hai – Chủ Nhật: 8:00 – 18:00 (có thể hẹn ngoài giờ theo lịch xem đất).</p>
<p>Khi nhận link chia sẻ từ nhân viên, số điện thoại trên web có thể hiện đúng số của nhân viên đó để quý khách liên hệ nhanh hơn.</p>
$html$,
  'Hotline 0977.656.280 — văn phòng BT6.8 KĐT Tây Nam Sách. Tư vấn mua bán nhà đất Nam Sách, Hải Dương.',
  'Liên hệ An Hưng Land: hotline 0977.656.280, văn phòng BT6.8 KĐT Tây Nam Sách. Tư vấn nhà đất Nam Sách.',
  'An Hưng Land',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'seed_post_chinh_sach_bao_mat',
  'chinh-sach-bao-mat',
  'chinh-sach',
  'PUBLISHED',
  'Chính sách bảo mật',
  NULL,
  $html$
<p>Chính sách này mô tả cách <strong>An Hưng Land</strong> xử lý thông tin khi quý khách truy cập website <em>anhungland.com</em>.</p>
<h2>1. Thông tin chúng tôi thu thập</h2>
<ul>
<li>Dữ liệu kỹ thuật cơ bản khi duyệt web (ví dụ địa chỉ IP, loại trình duyệt, trang đã xem) phục vụ vận hành và thống kê.</li>
<li>Số điện thoại hoặc nội dung quý khách chủ động gửi khi gọi / nhắn tin hotline hoặc nhân viên.</li>
</ul>
<h2>2. Mục đích sử dụng</h2>
<ul>
<li>Hiển thị nhà đất đang rao, bài viết và thông tin liên hệ.</li>
<li>Tư vấn mua bán theo yêu cầu của quý khách.</li>
<li>Cải thiện trải nghiệm website (đo lường truy cập).</li>
</ul>
<h2>3. Cookie và theo dõi</h2>
<p>Website có thể dùng cookie / mã đo lường (ví dụ Meta Pixel, Google Analytics) để hiểu cách khách dùng trang. Quý khách có thể tắt cookie trong trình duyệt; một số tính năng có thể bị hạn chế.</p>
<h2>4. Chia sẻ thông tin</h2>
<p>Chúng tôi không bán thông tin cá nhân. Chỉ chia sẻ khi cần để hoàn tất tư vấn / giao dịch với sự đồng ý của quý khách, hoặc khi pháp luật yêu cầu.</p>
<h2>5. Liên hệ về bảo mật</h2>
<p>Mọi câu hỏi về chính sách này: gọi <a href="tel:0977656280">0977.656.280</a> hoặc đến văn phòng BT6.8 KĐT Tây Nam Sách.</p>
<p><em>An Hưng Land có thể cập nhật nội dung trang này khi thay đổi quy trình. Bản mới nhất luôn hiển thị tại đây.</em></p>
$html$,
  'Cách An Hưng Land thu thập và dùng thông tin khi quý khách truy cập anhungland.com.',
  'Chính sách bảo mật An Hưng Land: dữ liệu truy cập, cookie, mục đích tư vấn nhà đất Nam Sách.',
  'An Hưng Land',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'seed_post_tin_tuc_gioi_thieu',
  'an-hung-land-tu-van-mua-ban-nha-dat-nam-sach',
  'tin-tuc',
  'PUBLISHED',
  'An Hưng Land — tư vấn mua bán nhà đất Nam Sách',
  NULL,
  $html$
<p><strong>An Hưng Land</strong> đồng hành cùng khách hàng tìm nhà đất thổ cư, đất đấu giá và các khu đô thị trên địa bàn <strong>huyện Nam Sách, Hải Dương</strong>.</p>
<p>Trên website, quý khách có thể xem các lô đang mở bán đã được đăng công khai, đọc thông tin dự án và kiến thức pháp lý cơ bản trước khi liên hệ nhân viên.</p>
<ul>
<li>Xem danh sách nhà đất: mục <a href="/mua-ban-nha-dat-huyen-nam-sach">Mua bán nhà đất huyện Nam Sách</a>.</li>
<li>Gọi hotline <a href="tel:0977656280">0977.656.280</a> để được tư vấn nhanh.</li>
</ul>
<p>Các tin tiếp theo sẽ cập nhật tình hình thị trường và hoạt động của văn phòng tại KĐT Tây Nam Sách.</p>
$html$,
  'An Hưng Land tư vấn mua bán nhà đất thổ cư và khu đô thị tại huyện Nam Sách, Hải Dương.',
  'Tin An Hưng Land: tư vấn mua bán nhà đất Nam Sách — xem lô đang mở bán và liên hệ hotline 0977.656.280.',
  'An Hưng Land',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'seed_post_kien_thuc_checklist',
  'checklist-truoc-khi-mua-dat-tho-cu-nam-sach',
  'kien-thuc',
  'PUBLISHED',
  'Checklist trước khi mua đất thổ cư Nam Sách',
  NULL,
  $html$
<p>Trước khi đặt cọc mua đất thổ cư tại Nam Sách, nên chuẩn bị các bước sau để giảm rủi ro:</p>
<ol>
<li><strong>Xác minh sổ / giấy tờ:</strong> sổ đỏ đứng tên ai, có thế chấp / tranh chấp không.</li>
<li><strong>Đối chiếu thực địa:</strong> ranh giới, mặt tiền, đường đi, hạ tầng điện nước.</li>
<li><strong>Quy hoạch:</strong> hỏi địa chính xã / huyện về lộ giới, quy hoạch treo nếu có.</li>
<li><strong>Giá tham chiếu:</strong> so vài lô cùng thôn / khu trong cùng khoảng diện tích.</li>
<li><strong>Hợp đồng:</strong> điều khoản đặt cọc, thời hạn công chứng, trách nhiệm bên bán.</li>
</ol>
<p>An Hưng Land hỗ trợ khảo sát thực tế và giải thích hồ sơ trước khi quý khách quyết định. Hotline: <a href="tel:0977656280">0977.656.280</a>.</p>
$html$,
  'Năm việc nên kiểm trước khi đặt cọc đất thổ cư Nam Sách: sổ, thực địa, quy hoạch, giá, hợp đồng.',
  'Checklist mua đất thổ cư Nam Sách: sổ đỏ, ranh giới, quy hoạch, giá tham chiếu và hợp đồng đặt cọc.',
  'An Hưng Land',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("category", "slug") DO NOTHING;
