-- Seed one published «Kinh nghiệm» post (owner 2026-09-07). Idempotent.

INSERT INTO "PublicPost" (
  "id", "slug", "category", "status", "title", "coverImageUrl", "bodyHtml", "excerpt",
  "metaDescription", "authorLabel", "publishedAt", "createdAt", "updatedAt"
)
VALUES
(
  'seed_post_kinh_nghiem_xem_dat',
  '5-viec-nen-lam-khi-di-xem-dat-nam-sach',
  'kinh-nghiem',
  'PUBLISHED',
  '5 việc nên làm khi đi xem đất Nam Sách',
  NULL,
  $html$
<p>Đi xem đất thật khác xem ảnh trên mạng. Dưới đây là vài việc An Hưng Land thường nhắc khách làm ngay tại hiện trường:</p>
<ol>
<li><strong>Đi đúng khung giờ:</strong> sáng sớm hoặc chiều mát dễ thấy ngập nước, tiếng ồn, hướng nắng.</li>
<li><strong>Đo nhanh mặt tiền và chiều sâu:</strong> đối chiếu với mô tả rao bán; hỏi rõ phần nào nằm trong sổ.</li>
<li><strong>Quan sát đường vào:</strong> đường bê tông / đất, xe ô tô vào được không, có lối đi chung không.</li>
<li><strong>Hỏi hàng xóm ngắn:</strong> ai ở quanh, có tranh chấp lối đi / hàng rào không.</li>
<li><strong>Chụp ảnh định vị:</strong> góc lô, biển số đường, điểm mốc gần nhất để đối chiếu sổ sau.</li>
</ol>
<p>Sau buổi xem, nên ghi lại cảm nhận trong ngày — đừng quyết định chỉ vì giá «rẻ hơn lô bên cạnh». Cần hỗ trợ khảo sát: gọi <a href="tel:0977656280">0977.656.280</a>.</p>
$html$,
  'Năm việc thực tế khi đi xem đất Nam Sách: giờ xem, đo đạc, đường vào, hỏi hàng xóm, chụp mốc.',
  'Kinh nghiệm xem đất Nam Sách: 5 việc nên làm tại hiện trường trước khi đặt cọc.',
  'An Hưng Land',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("category", "slug") DO NOTHING;
