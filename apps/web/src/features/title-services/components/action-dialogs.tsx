'use client';

import { FilePlus, ListPlus, Pencil, Receipt, Wallet } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  TITLE_SERVICE_DOC_LABELS,
  TITLE_SERVICE_STATUS_LABELS,
  TITLE_SERVICE_STEP_LABELS,
  TitleServiceDocKind,
  TitleServiceMoneyKind,
  TitleServiceStatus,
  TitleServiceStepType,
  type TitleServiceListItem,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { parseMoneyInput, todayInputValue } from '../display';
import type { TitleServiceAction } from './action-menu';

export type DialogKind = Extract<TitleServiceAction, 'progress' | 'thu' | 'chi' | 'attach' | 'edit'>;

type Props = {
  kind: DialogKind | null;
  item: TitleServiceListItem | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmitProgress: (stepType: TitleServiceStepType, note: string, happenedAt: string) => void;
  onSubmitMoney: (
    kind: TitleServiceMoneyKind,
    title: string,
    amountVnd: number,
    happenedAt: string,
  ) => void;
  onSubmitAttach: (kind: TitleServiceDocKind, fileName: string) => void;
  onSubmitEdit: (status: TitleServiceStatus, agreedFeeVnd: number | null, needSummary: string, note: string) => void;
};

const TITLES: Record<DialogKind, string> = {
  progress: 'Thêm tiến độ',
  thu: 'Nhập thu',
  chi: 'Nhập chi phí',
  attach: 'Thêm tài liệu',
  edit: 'Sửa thông tin hồ sơ',
};

const ICONS = {
  progress: ListPlus,
  thu: Wallet,
  chi: Receipt,
  attach: FilePlus,
  edit: Pencil,
};

export function ActionDialogs({
  kind,
  item,
  busy,
  error,
  onClose,
  onSubmitProgress,
  onSubmitMoney,
  onSubmitAttach,
  onSubmitEdit,
}: Props) {
  const [stepType, setStepType] = useState<TitleServiceStepType>(TitleServiceStepType.DO_DAC);
  const [note, setNote] = useState('');
  const [happenedAt, setHappenedAt] = useState(todayInputValue());
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [docKind, setDocKind] = useState<TitleServiceDocKind>(TitleServiceDocKind.SO_DO);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState<TitleServiceStatus>(TitleServiceStatus.DANG_LAM);
  const [feeText, setFeeText] = useState('');
  const [needSummary, setNeedSummary] = useState('');

  useEffect(() => {
    if (!kind || !item) return;
    setStepType(TitleServiceStepType.DO_DAC);
    setNote(kind === 'edit' ? (item.note ?? '') : '');
    setHappenedAt(todayInputValue());
    setTitle(kind === 'thu' ? 'Thu tiền dịch vụ' : '');
    setAmountText('');
    setDocKind(TitleServiceDocKind.SO_DO);
    setFileName('');
    setStatus(item.status);
    setFeeText(item.agreedFeeVnd != null ? String(item.agreedFeeVnd) : '');
    setNeedSummary(item.needSummary ?? '');
  }, [kind, item]);

  if (!kind || !item) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (kind === 'progress') {
      onSubmitProgress(stepType, note, happenedAt);
      return;
    }
    if (kind === 'thu' || kind === 'chi') {
      const amount = parseMoneyInput(amountText);
      if (!title.trim()) return;
      if (!amount) return;
      onSubmitMoney(
        kind === 'thu' ? TitleServiceMoneyKind.THU : TitleServiceMoneyKind.CHI,
        title,
        amount,
        happenedAt,
      );
      return;
    }
    if (kind === 'attach') {
      if (!fileName.trim()) return;
      onSubmitAttach(docKind, fileName);
      return;
    }
    const fee = parseMoneyInput(feeText);
    onSubmitEdit(status, fee, needSummary, note);
  }

  return (
    <CrmDialog open title={TITLES[kind]} icon={ICONS[kind]} onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit}>
        {kind === 'progress' ? (
          <>
            <label>
              Bước tiến độ
              <select
                value={stepType}
                onChange={(e) => setStepType(e.target.value as TitleServiceStepType)}
              >
                {Object.values(TitleServiceStepType).map((v) => (
                  <option key={v} value={v}>
                    {TITLE_SERVICE_STEP_LABELS[v]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ghi chú
              <textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <label>
              Ngày
              <input type="date" value={happenedAt} onChange={(e) => setHappenedAt(e.target.value)} />
            </label>
          </>
        ) : null}

        {kind === 'thu' || kind === 'chi' ? (
          <>
            <label>
              Tiêu đề
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Số tiền
              <input
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                placeholder="vd. 3000000"
                required
              />
            </label>
            <label>
              Ngày
              <input type="date" value={happenedAt} onChange={(e) => setHappenedAt(e.target.value)} />
            </label>
          </>
        ) : null}

        {kind === 'attach' ? (
          <>
            <label>
              Loại tài liệu
              <select
                value={docKind}
                onChange={(e) => setDocKind(e.target.value as TitleServiceDocKind)}
              >
                {Object.values(TitleServiceDocKind).map((v) => (
                  <option key={v} value={v}>
                    {TITLE_SERVICE_DOC_LABELS[v]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tên file (mock)
              <input
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="vd. so-do.pdf"
                required
              />
            </label>
          </>
        ) : null}

        {kind === 'edit' ? (
          <>
            <label>
              Trạng thái
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TitleServiceStatus)}
              >
                {Object.values(TitleServiceStatus).map((v) => (
                  <option key={v} value={v}>
                    {TITLE_SERVICE_STATUS_LABELS[v]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Giá thỏa thuận
              <input
                value={feeText}
                onChange={(e) => setFeeText(e.target.value)}
                placeholder="vd. 30000000"
              />
            </label>
            <label>
              Nhu cầu
              <textarea value={needSummary} onChange={(e) => setNeedSummary(e.target.value)} />
            </label>
            <label>
              Ghi chú
              <textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </>
        ) : null}

        {error ? <p className="crm-form-error">{error}</p> : null}
        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="crm-btn primary" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
