/** Open-or-create: form tạo khoá lô; GD mở (`DA_COC` | `DA_CONG_CHUNG`) → trang sửa GD đó. */
export function createTransactionHref(lodatId: string): string {
  return `/giao-dich/tao?lodatId=${encodeURIComponent(lodatId)}`;
}
