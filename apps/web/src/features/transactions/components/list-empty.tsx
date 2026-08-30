import Link from 'next/link';

type Props = {
  filtered: boolean;
};

/** Empty list: no GDs yet (STAFF) vs no rows matching filters. */
export function TransactionListEmpty({ filtered }: Props) {
  if (filtered) {
    return <p className="tx-empty-copy">Không có giao dịch phù hợp.</p>;
  }
  return (
    <div className="tx-empty-copy">
      <p>Chưa có giao dịch.</p>
      <p>
        Tạo từ nút <strong>Giao dịch</strong> trên lô đất —{' '}
        <Link href="/lo-dat">mở danh sách lô đất</Link>.
      </p>
    </div>
  );
}
