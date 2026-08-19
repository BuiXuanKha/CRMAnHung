import {
  TITLE_SERVICE_STATUS_LABELS,
  TITLE_SERVICE_STEP_LABELS,
  TitleServiceStatus,
  TitleServiceStepType,
  type TitleServiceDetail,
  type TitleServiceListItem,
  type TitleServiceProgress,
} from '@crmanhung/shared';
import type { BadgeTone } from '@/shared/ui/badge';

export function formatMoneyVnd(n?: number | null): string {
  if (n == null) return '—';
  return `${n.toLocaleString('vi-VN')} đ`;
}

export function formatDateShort(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatDaysWorking(days: number): string {
  if (!Number.isFinite(days) || days < 0) return '—';
  if (days === 0) return 'Hôm nay';
  return `${days} ngày`;
}

export function computeDaysWorking(
  startedAt: string,
  completedAt: string | null | undefined,
  status: TitleServiceStatus,
): number {
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start) || start <= 0) return 0;
  const done =
    (status === TitleServiceStatus.HOAN_THANH || status === TitleServiceStatus.HUY) &&
    completedAt
      ? new Date(completedAt).getTime()
      : Date.now();
  if (Number.isNaN(done)) return 0;
  return Math.max(0, Math.floor((done - start) / 86_400_000));
}

export function statusLabel(status: TitleServiceStatus): string {
  return TITLE_SERVICE_STATUS_LABELS[status];
}

export function statusTone(status: TitleServiceStatus): BadgeTone {
  switch (status) {
    case TitleServiceStatus.DANG_LAM:
      return 'green';
    case TitleServiceStatus.TAM_DUNG:
      return 'gray';
    case TitleServiceStatus.HOAN_THANH:
      return 'blue';
    case TitleServiceStatus.HUY:
      return 'red';
  }
}

export function stepLabel(step: TitleServiceStepType): string {
  return TITLE_SERVICE_STEP_LABELS[step];
}

export function progressLine(latest?: TitleServiceProgress | null): {
  title: string;
  date: string | null;
} {
  if (!latest) return { title: 'Chưa ghi tiến độ', date: null };
  return { title: stepLabel(latest.stepType), date: formatDateShort(latest.happenedAt) };
}

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  {
    value: TitleServiceStatus.DANG_LAM,
    label: TITLE_SERVICE_STATUS_LABELS[TitleServiceStatus.DANG_LAM],
  },
  {
    value: TitleServiceStatus.TAM_DUNG,
    label: TITLE_SERVICE_STATUS_LABELS[TitleServiceStatus.TAM_DUNG],
  },
  {
    value: TitleServiceStatus.HOAN_THANH,
    label: TITLE_SERVICE_STATUS_LABELS[TitleServiceStatus.HOAN_THANH],
  },
  { value: TitleServiceStatus.HUY, label: TITLE_SERVICE_STATUS_LABELS[TitleServiceStatus.HUY] },
];

export const STEP_FILTER_OPTIONS = Object.values(TitleServiceStepType).map((value) => ({
  value,
  label: TITLE_SERVICE_STEP_LABELS[value],
}));

export type ExtraFilters = {
  need: 'all' | 'has' | 'empty';
  progress: 'all' | 'has' | 'empty';
  money: 'all' | 'has' | 'empty';
  docs: 'all' | 'has' | 'empty';
};

export const NEED_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả nhu cầu' },
  { value: 'has', label: 'Có nhu cầu' },
  { value: 'empty', label: 'Chưa có nhu cầu' },
];

export const PROGRESS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả tiến độ' },
  { value: 'has', label: 'Đã ghi tiến độ' },
  { value: 'empty', label: 'Chưa ghi tiến độ' },
];

export const MONEY_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả giá' },
  { value: 'has', label: 'Có giá thỏa thuận' },
  { value: 'empty', label: 'Chưa nhập giá' },
];

export const DOCS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả tài liệu' },
  { value: 'has', label: 'Có tài liệu' },
  { value: 'empty', label: 'Chưa có tài liệu' },
];

export function countMobileTitleServiceFilters(status: string): number {
  return status ? 1 : 0;
}

export function applyExtraFilters(
  items: TitleServiceListItem[],
  extra: ExtraFilters,
): TitleServiceListItem[] {
  return items.filter((item) => {
    const need = Boolean(item.needSummary?.trim());
    if (extra.need === 'has' && !need) return false;
    if (extra.need === 'empty' && need) return false;

    const progress = Boolean(item.latestProgress);
    if (extra.progress === 'has' && !progress) return false;
    if (extra.progress === 'empty' && progress) return false;

    const money = item.agreedFeeVnd != null && item.agreedFeeVnd > 0;
    if (extra.money === 'has' && !money) return false;
    if (extra.money === 'empty' && money) return false;

    const docs = item.documentCount > 0;
    if (extra.docs === 'has' && !docs) return false;
    if (extra.docs === 'empty' && docs) return false;

    return true;
  });
}

export function todayInputValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function hydrateTitleServiceDetail(
  row: Omit<
    TitleServiceDetail,
    'daysWorking' | 'documentCount' | 'totalThuVnd' | 'totalChiVnd' | 'latestProgress'
  > & {
    progress: TitleServiceDetail['progress'];
    moneyEntries: TitleServiceDetail['moneyEntries'];
    attachments: TitleServiceDetail['attachments'];
  },
): TitleServiceDetail {
  const thu = row.moneyEntries
    .filter((e) => e.kind === 'THU')
    .reduce((s, e) => s + e.amountVnd, 0);
  const chi = row.moneyEntries
    .filter((e) => e.kind === 'CHI')
    .reduce((s, e) => s + e.amountVnd, 0);
  const progress = [...row.progress].sort((a, b) => b.happenedAt.localeCompare(a.happenedAt));
  return {
    ...row,
    daysWorking: computeDaysWorking(row.startedAt, row.completedAt, row.status),
    documentCount: row.attachments.length,
    totalThuVnd: thu,
    totalChiVnd: chi,
    latestProgress: progress[0] ?? null,
    progress,
  };
}

export function parseMoneyInput(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}
