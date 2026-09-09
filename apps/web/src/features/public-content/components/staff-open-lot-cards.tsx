import { useRef } from 'react';
import { CircleAlert, ImageOff, Sparkles } from 'lucide-react';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import { formatArea, formatFrontageDir, kindLabel, kindTone } from '@/features/lodats/display';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import { lotPriceDisplay, lotWebLabel, lotWebTone } from '../display';

const DOUBLE_TAP_MS = 400;

type Props = {
  items: PublicWebStaffLotRow[];
  total: number;
  selectedId: string | null;
  onSelect: (lodatId: string) => void;
  onEdit: (lodatId: string) => void;
  onGptContent: (lodatId: string) => void;
  onNeedsWebUpdate: (row: PublicWebStaffLotRow) => void;
};

export function StaffOpenLotCards({
  items,
  total,
  selectedId,
  onSelect,
  onEdit,
  onGptContent,
  onNeedsWebUpdate,
}: Props) {
  const lastTap = useRef<{ id: string; at: number } | null>(null);

  function handleClick(lodatId: string) {
    onSelect(lodatId);
    const now = Date.now();
    const prev = lastTap.current;
    if (prev && prev.id === lodatId && now - prev.at < DOUBLE_TAP_MS) {
      lastTap.current = null;
      onEdit(lodatId);
      return;
    }
    lastTap.current = { id: lodatId, at: now };
  }

  return (
    <section className="pw-cards" aria-label="Lô nhân viên đang mở bán">
      {items.length === 0 ? (
        <p className="pw-empty">Không có lô đất phù hợp.</p>
      ) : (
        <ul className="pw-card-list">
          {items.map((row) => {
            const price = lotPriceDisplay(row);
            const hasNeedsWebUpdate = Boolean(row.needsWebUpdate);
            return (
              <li
                key={row.lodatId}
                data-list-row-id={row.lodatId}
                className={
                  selectedId === row.lodatId ? 'pw-card-item is-selected' : 'pw-card-item'
                }
              >
                <button
                  type="button"
                  className="pw-card"
                  onClick={() => handleClick(row.lodatId)}
                  onDoubleClick={() => onEdit(row.lodatId)}
                >
                  <span className="pw-thumb">
                    {row.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.coverImageUrl} alt="" />
                    ) : (
                      <span className="pw-thumb-empty">
                        <Icon icon={ImageOff} size="sm" />
                      </span>
                    )}
                  </span>
                  <span className="pw-card-body">
                    <span className="pw-card-top">
                      <span className="pw-title-row">
                        <strong className="pw-title">{row.title}</strong>
                        {hasNeedsWebUpdate ? (
                          <span
                            role="button"
                            tabIndex={0}
                            className="pw-crm-drift-btn"
                            title="Lô CRM đã cập nhật — cần cập nhật bài web"
                            aria-label="Lô CRM đã cập nhật, cần cập nhật bài đăng web"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              onNeedsWebUpdate(row);
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== 'Enter' && event.key !== ' ') return;
                              event.preventDefault();
                              event.stopPropagation();
                              onNeedsWebUpdate(row);
                            }}
                          >
                            <Icon icon={CircleAlert} size="sm" />
                          </span>
                        ) : null}
                      </span>
                      <CrmBadge tone={lotWebTone(row.isPublished)}>
                        {lotWebLabel(row.isPublished)}
                      </CrmBadge>
                    </span>
                    <span className="pw-sub">{row.location || '—'}</span>
                    <span className="pw-card-meta">
                      <CrmBadge tone={kindTone(row.kind)}>{kindLabel(row.kind)}</CrmBadge>
                      <span className="pw-sub">
                        {formatArea(row.areaM2)} · {formatFrontageDir(row.frontageM, row.direction)}
                      </span>
                    </span>
                    <span className="pw-staff">{row.staffName}</span>
                    {price.isMoney ? (
                      <span className="crm-money">{price.text}</span>
                    ) : (
                      <span className="pw-contact">{price.text}</span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  className="pw-gpt-btn pw-card-gpt"
                  title="Tạo content bằng AI GPT"
                  onClick={() => onGptContent(row.lodatId)}
                >
                  <Icon icon={Sparkles} size="sm" />
                  GPT
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="pw-table-foot">
        Hiển thị <strong>{items.length}</strong> / Tổng <strong>{total}</strong> lô
      </p>
    </section>
  );
}
