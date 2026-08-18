'use client';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
};

export function FilterBar({ keyword, onKeyword }: Props) {
  return (
    <div className="tx-filter">
      <input
        className="tx-search"
        value={keyword}
        onChange={(e) => onKeyword(e.target.value)}
        placeholder="Tìm mã GD, lô đất, người bán, người mua, ghi chú..."
        aria-label="Tìm giao dịch"
      />
    </div>
  );
}
