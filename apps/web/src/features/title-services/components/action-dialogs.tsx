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
import {
  formatMoneyInput,
  parseMoneyInput,
  todayInputValue,
  TITLE_SERVICE_EDIT_STATUSES,
  normalizeEditStatus,
} from '../display';
import { assertTitleServiceFile } from '../api';
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
  onSubmitAttach: (kind: TitleServiceDocKind, file: File) => void;
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
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
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
    setFile(null);
    setFileError(null);
    setStatus(normalizeEditStatus(item.status));
    setFeeText(
      item.agreedFeeVnd != null ? formatMoneyInput(String(item.agreedFeeVnd)) : '',
    );
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
      if (!file) {
        setFileError('Chọn file tài liệu.');
        return;
      }
      try {
        assertTitleServiceFile(file);
      } catch (err) {
        setFileError((err as Error).message);
        return;
      }
      setFileError(null);
      onSubmitAttach(docKind, file);
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
                onChange={(e) => setAmountText(formatMoneyInput(e.target.value))}
                placeholder="vd. 3.000.000"
                inputMode="numeric"
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
              File
              <span className="crm-file-row">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  aria-label="Chọn tệp tài liệu"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                />
                <span className="crm-file-btn">Chọn tệp</span>
                <span className="crm-file-name">{file?.name || 'Chưa chọn tệp'}</span>
              </span>
            </label>
            <p className="crm-form-hint">
              Ảnh hoặc PDF, tối đa 12 MB. Giấy tờ mật — không đưa lên CDN.
            </p>
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
                {TITLE_SERVICE_EDIT_STATUSES.map((v) => (
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
                onChange={(e) => setFeeText(formatMoneyInput(e.target.value))}
                placeholder="vd. 30.000.000"
                inputMode="numeric"
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

        {error || fileError ? <p className="crm-form-error">{error || fileError}</p> : null}
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
