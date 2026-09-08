'use client';

import { FilePlus, ListPlus, Receipt, Wallet } from 'lucide-react';
import {
  TITLE_SERVICE_DOC_LABELS,
  TITLE_SERVICE_MONEY_LABELS,
  TitleServiceMoneyKind,
  type TitleServiceDetail,
} from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import { docKindTone, formatDateTime, formatMoneyVnd, statusLabel, stepLabel } from '../display';

type Props = {
  detail: TitleServiceDetail;
  onAddProgress: () => void;
  onAddAttach: () => void;
  onAddThu: () => void;
  onAddChi: () => void;
  onOpenAttachment: (attachmentId: string) => void;
};

export function TitleServiceDetailBody({
  detail,
  onAddProgress,
  onAddAttach,
  onAddThu,
  onAddChi,
  onOpenAttachment,
}: Props) {
  return (
    <>
      <div className="sd-summary">
        <div>
          <span>Trạng thái</span>
          <strong>{statusLabel(detail.status)}</strong>
        </div>
        <div>
          <span>Giá thỏa thuận</span>
          <strong className="crm-money">{formatMoneyVnd(detail.agreedFeeVnd)}</strong>
        </div>
        <div>
          <span>Đã thu</span>
          <strong className="sd-thu">{formatMoneyVnd(detail.totalThuVnd)}</strong>
        </div>
        <div>
          <span>Đã chi</span>
          <strong className="sd-chi">{formatMoneyVnd(detail.totalChiVnd)}</strong>
        </div>
        <div className="sd-summary-need">
          <span>Nhu cầu</span>
          <strong>{detail.needSummary?.trim() || '—'}</strong>
        </div>
      </div>

      <div className="sd-quick">
        <button type="button" onClick={onAddProgress}>
          <Icon icon={ListPlus} size={14} /> Tiến độ
        </button>
        <button type="button" onClick={onAddAttach}>
          <Icon icon={FilePlus} size={14} /> Tài liệu
        </button>
        <button type="button" onClick={onAddThu}>
          <Icon icon={Wallet} size={14} /> Thu
        </button>
        <button type="button" onClick={onAddChi}>
          <Icon icon={Receipt} size={14} /> Chi
        </button>
      </div>

      <section className="sd-section">
        <h3>Lịch sử tiến độ</h3>
        {detail.progress.length === 0 ? (
          <p className="sd-muted">Chưa có cập nhật tiến độ.</p>
        ) : (
          <ul className="sd-timeline">
            {detail.progress.map((p) => (
              <li key={p.id} className={p.completedAt ? 'is-done' : undefined}>
                <div className="sd-timeline-meta">
                  <strong>{stepLabel(p.stepType)}</strong>
                  {p.completedAt ? (
                    <CrmBadge tone="green">Đã hoàn thành</CrmBadge>
                  ) : null}
                  <span>{formatDateTime(p.happenedAt)}</span>
                </div>
                {p.note ? <p>{p.note}</p> : null}
                {p.employeeName ? <span className="sd-muted">Bởi {p.employeeName}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sd-section">
        <h3>File tài liệu</h3>
        {detail.attachments.length === 0 ? (
          <p className="sd-muted">Chưa có tài liệu đính kèm.</p>
        ) : (
          <ul className="sd-files">
            {detail.attachments.map((att) => (
              <li key={att.id}>
                <div className="sd-file-head">
                  <CrmBadge tone={docKindTone(att.kind)}>
                    {TITLE_SERVICE_DOC_LABELS[att.kind]}
                  </CrmBadge>
                  <span>{formatDateTime(att.createdAt)}</span>
                </div>
                <button
                  type="button"
                  className="sd-file-open"
                  onClick={() => onOpenAttachment(att.id)}
                >
                  {att.fileName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sd-section">
        <h3>Thu / Chi gần đây</h3>
        {detail.moneyEntries.length === 0 ? (
          <p className="sd-muted">Chưa có khoản thu / chi.</p>
        ) : (
          <ul className="sd-timeline">
            {detail.moneyEntries.map((e) => (
              <li key={e.id}>
                <div className="sd-timeline-meta">
                  <strong className={e.kind === TitleServiceMoneyKind.THU ? 'sd-thu' : 'sd-chi'}>
                    {TITLE_SERVICE_MONEY_LABELS[e.kind]} · {formatMoneyVnd(e.amountVnd)}
                  </strong>
                  <span>{formatDateTime(e.happenedAt)}</span>
                </div>
                <p>{e.title}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
