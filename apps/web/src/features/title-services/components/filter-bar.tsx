'use client';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
};

export function FilterBar({ keyword, onKeyword }: Props) {
  return (
    <div className="sd-filter">
      <input
        className="sd-search"
        value={keyword}
        onChange={(e) => onKeyword(e.target.value)}
        placeholder="Tìm mã hồ sơ, tên khách, SĐT..."
        aria-label="Tìm hồ sơ sổ đỏ"
      />
    </div>
  );
}
