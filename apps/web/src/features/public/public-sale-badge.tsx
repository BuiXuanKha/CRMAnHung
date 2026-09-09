import { saleStatusLabel, saleStatusTone } from './sale-status-label';

type Props = {
  status?: string | null;
  className?: string;
};

/** Corner badge on guest cover / gallery — Mở bán · Tạm dừng · Đã bán · Đặt cọc. */
export function PublicSaleBadge({ status, className }: Props) {
  const label = saleStatusLabel(status);
  const tone = saleStatusTone(status);
  if (!label || !tone) return null;
  const classes = ['ph-product-sale', `ph-product-sale--${tone}`, className]
    .filter(Boolean)
    .join(' ');
  return <span className={classes}>{label}</span>;
}
