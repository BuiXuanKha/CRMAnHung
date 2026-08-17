'use client';

type Props = {
  keyword: string;
  onKeyword: (v: string) => void;
};

export function FilterBar({ keyword, onKeyword }: Props) {
  return (
    <div className="ld-filter">
      <input
        className="ld-search"
        value={keyword}
        onChange={(e) => onKeyword(e.target.value)}
        placeholder="Tìm lô, địa chỉ, khách... (@ cả tạm dừng)"
        aria-label="Tìm lô đất"
      />
    </div>
  );
}
