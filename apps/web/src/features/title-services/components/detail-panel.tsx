'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TitleServiceDetail, TitleServiceListItem } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { TitleServiceDetailBody } from './detail-body';

type Props = {
  open: boolean;
  selected: TitleServiceListItem | null;
  detail: TitleServiceDetail | null;
  loading: boolean;
  error: string | null;
  onToggle: () => void;
  onAddProgress: () => void;
  onAddAttach: () => void;
  onAddThu: () => void;
  onAddChi: () => void;
  onOpenAttachment: (attachmentId: string) => void;
};

export function DetailPanel({
  open,
  selected,
  detail,
  loading,
  error,
  onToggle,
  onAddProgress,
  onAddAttach,
  onAddThu,
  onAddChi,
  onOpenAttachment,
}: Props) {
  return (
    <aside className="sd-side" aria-label="Chi tiết hồ sơ">
      {open ? (
        <div className="sd-panel">
          <header className="sd-panel-head">
            <div>
              <p className="sd-kicker">Chi tiết hồ sơ</p>
              <h2>{selected?.customerName ?? 'Chưa chọn hồ sơ'}</h2>
              <p className="sd-panel-sub">
                {selected
                  ? `${selected.code}${selected.primaryPhone ? ` · ${selected.primaryPhone}` : ''}`
                  : 'Bấm một dòng để xem bên phải.'}
              </p>
            </div>
            <button type="button" className="sd-collapse" onClick={onToggle} aria-label="Thu hẹp">
              <Icon icon={ChevronRight} size={18} />
            </button>
          </header>
          <div className="sd-panel-body">
            {!selected ? (
              <p className="sd-panel-empty">Chọn một hồ sơ để xem lịch sử tiến độ và tài liệu.</p>
            ) : null}
            {selected && loading ? <p className="sd-panel-empty">Đang tải chi tiết…</p> : null}
            {selected && error ? <p className="sd-panel-error">{error}</p> : null}
            {selected && detail && !loading ? (
              <TitleServiceDetailBody
                detail={detail}
                onAddProgress={onAddProgress}
                onAddAttach={onAddAttach}
                onAddThu={onAddThu}
                onAddChi={onAddChi}
                onOpenAttachment={onOpenAttachment}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className={['sd-tab', open ? 'active' : ''].filter(Boolean).join(' ')}
        onClick={onToggle}
        title="Chi tiết hồ sơ"
      >
        <span className="chev" aria-hidden>
          <Icon icon={ChevronLeft} size="sm" />
        </span>
        <span className="lbl">Chi tiết hồ sơ</span>
      </button>
    </aside>
  );
}
