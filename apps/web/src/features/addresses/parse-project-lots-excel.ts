import * as XLSX from 'xlsx';
import {
  LODAT_DIRECTION_OPTIONS,
  PROJECT_LOT_EXCEL_COLUMNS,
  PROJECT_LOT_IMPORT_MAX_ROWS,
} from '@crmanhung/shared';

export { PROJECT_LOT_EXCEL_COLUMNS, PROJECT_LOT_IMPORT_MAX_ROWS };

type ExcelField = (typeof PROJECT_LOT_EXCEL_COLUMNS)[number]['field'];

const DIRECTION_SET = new Set<string>(LODAT_DIRECTION_OPTIONS);

const MAX_HEADER_SCAN_ROWS = 25;

const HEADER_ALIASES: Record<ExcelField, string[]> = {
  title: ['ten lo dat', 'tên lô đất', 'ten lo', 'tên lô', 'tieu de', 'tiêu đề', 'title', 'lo dat'],
  areaM2: ['dien tich', 'diện tích', 'dien tich m2', 'area m2', 'dt', 'dien tich (m2)'],
  frontageM: ['mat tien', 'mặt tiền', 'mat tien m', 'mt', 'mat tien (m)'],
  direction: ['huong', 'hướng', 'direction', 'huong lo'],
  note: ['ghi chu', 'ghi chú', 'note', 'mo ta', 'mô tả'],
};

export type ParsedProjectLotRow = {
  rowIndex: number;
  title: string;
  areaM2: number | null;
  frontageM: number | null;
  direction: string;
  note: string;
  valid: boolean;
  issues: string[];
  importOk?: boolean;
  importMessage?: string;
};

export type ParseProjectLotsResult = {
  rows: ParsedProjectLotRow[];
  parseError: string | null;
  errors?: { rowIndex: number; issues: string[] }[];
  headerRowIndex?: number;
};

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00a0/g, ' ')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[*:]/g, '')
    .replace(/\s+/g, ' ');
}

function headerMatches(key: string, alias: string): boolean {
  const a = normalizeHeader(alias);
  if (!key || !a) return false;
  if (key === a) return true;
  if (key.includes(a) || a.includes(key)) return true;
  return false;
}

function mapHeaderToField(header: unknown): ExcelField | null {
  const key = normalizeHeader(header);
  if (!key) return null;

  for (const col of PROJECT_LOT_EXCEL_COLUMNS) {
    if (headerMatches(key, col.label)) return col.field;
  }
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [ExcelField, string[]][]) {
    if (aliases.some((a) => headerMatches(key, a))) return field;
  }

  if (/ten\s*lo/.test(key) || (key.includes('lo') && key.includes('dat'))) return 'title';
  if (key.includes('dien') && key.includes('tich')) return 'areaM2';
  if (key.includes('mat') && key.includes('tien')) return 'frontageM';
  if (key.includes('huong')) return 'direction';
  if (key.includes('ghi') && key.includes('chu')) return 'note';

  return null;
}

function buildColumnMap(headerRow: unknown[]): Array<ExcelField | null> {
  return (headerRow || []).map((h) => mapHeaderToField(h));
}

/** Fallback: cột STT + 5 cột theo thứ tự chuẩn (map tên cột hoặc vị trí). */
function tryColumnMapWithSttPrefix(headerRow: unknown[]): Array<ExcelField | null> | null {
  const first = normalizeHeader(headerRow?.[0]);
  if (first !== 'stt' && first !== '#' && first !== 'no') return null;

  const expected: ExcelField[] = ['title', 'areaM2', 'frontageM', 'direction', 'note'];
  const map: Array<ExcelField | null> = [null];
  for (let i = 0; i < expected.length; i += 1) {
    map.push(mapHeaderToField(headerRow[i + 1]) || expected[i]);
  }
  const extra = (headerRow?.length || 0) - 1 - expected.length;
  for (let j = 0; j < extra; j += 1) {
    map.push(mapHeaderToField(headerRow[expected.length + 1 + j]) || null);
  }
  return map.includes('title') ? map : null;
}

function findHeaderRow(matrix: unknown[][]): {
  headerRowIndex: number;
  columnMap: Array<ExcelField | null>;
} | null {
  const limit = Math.min(MAX_HEADER_SCAN_ROWS, matrix.length);

  for (let i = 0; i < limit; i += 1) {
    const columnMap = buildColumnMap(matrix[i] || []);
    if (columnMap.includes('title')) {
      return { headerRowIndex: i, columnMap };
    }
    const sttMap = tryColumnMapWithSttPrefix(matrix[i] || []);
    if (sttMap) {
      return { headerRowIndex: i, columnMap: sttMap };
    }
  }

  return null;
}

function cellToString(cell: unknown): string {
  if (cell == null || cell === '') return '';
  if (typeof cell === 'number' && Number.isFinite(cell)) return String(cell);
  return String(cell).trim();
}

function describeHeaderRow(headerRow: unknown[]): string {
  const labels = (headerRow || [])
    .map((c) => cellToString(c))
    .filter(Boolean)
    .slice(0, 8);
  return labels.length ? labels.join(' | ') : '(trống)';
}

function padRow(row: unknown[], length: number): unknown[] {
  const next = [...(row || [])];
  while (next.length < length) next.push('');
  return next;
}

function parseNumberCell(value: unknown): number | null {
  const s = cellToString(value).replace(/,/g, '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function isRowEmpty(row: unknown[]): boolean {
  return !row || row.every((c) => cellToString(c) === '');
}

function markDuplicateTitles(rows: ParsedProjectLotRow[]): void {
  const seen = new Set<string>();
  for (const row of rows) {
    const key = row.title.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      row.issues.push('Trùng tên lô đất trong file');
      row.valid = false;
    } else {
      seen.add(key);
    }
  }
}

/** Đọc file Excel (.xlsx / .xls) → danh sách lô chuẩn hoá + lỗi parse. */
export async function parseProjectLotsExcelFile(file: File): Promise<ParseProjectLotsResult> {
  if (!file) {
    return { rows: [], parseError: 'Chưa chọn file.' };
  }

  const buffer = await file.arrayBuffer();
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array' });
  } catch {
    return { rows: [], parseError: 'Không đọc được file Excel.' };
  }

  const sheetNames = workbook.SheetNames || [];
  if (!sheetNames.length) {
    return { rows: [], parseError: 'File Excel không có sheet nào.' };
  }

  let matrix: unknown[][] = [];
  let headerInfo: ReturnType<typeof findHeaderRow> = null;
  let sheetLabel = sheetNames[0];

  for (const name of sheetNames) {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as unknown[][];
    if (!data.length) continue;
    const found = findHeaderRow(data);
    if (found) {
      matrix = data;
      headerInfo = found;
      sheetLabel = name;
      break;
    }
    if (!matrix.length) {
      matrix = data;
      sheetLabel = name;
    }
  }

  if (!matrix.length) {
    return { rows: [], parseError: 'Sheet trống.' };
  }

  if (!headerInfo) {
    headerInfo = findHeaderRow(matrix);
  }

  if (!headerInfo || !headerInfo.columnMap.includes('title')) {
    return {
      rows: [],
      parseError:
        `Không tìm thấy cột "Tên lô đất" (sheet "${sheetLabel}"). ` +
        `Hàng đầu: ${describeHeaderRow(matrix[0] || [])}. ` +
        'Cần hàng tiêu đề: Tên lô đất, Diện tích, Mặt tiền, Hướng, Ghi chú — có thể nằm dưới dòng tiêu đề dự án.',
    };
  }

  const { headerRowIndex, columnMap } = headerInfo;
  const colCount = columnMap.length;
  const rows: ParsedProjectLotRow[] = [];
  const errors: { rowIndex: number; issues: string[] }[] = [];

  for (let i = headerRowIndex + 1; i < matrix.length; i += 1) {
    const line = padRow(matrix[i], colCount);
    if (isRowEmpty(line)) continue;

    const record: ParsedProjectLotRow = {
      rowIndex: i + 1,
      title: '',
      areaM2: null,
      frontageM: null,
      direction: '',
      note: '',
      valid: true,
      issues: [],
    };

    columnMap.forEach((field, colIdx) => {
      if (!field) return;
      const raw = line[colIdx];
      if (field === 'title') {
        record.title = cellToString(raw);
      } else if (field === 'areaM2' || field === 'frontageM') {
        const n = parseNumberCell(raw);
        if (cellToString(raw) && n == null) {
          record.issues.push(`${field === 'areaM2' ? 'Diện tích' : 'Mặt tiền'} không hợp lệ`);
        } else {
          record[field] = n;
        }
      } else if (field === 'direction') {
        const d = cellToString(raw);
        if (d && !DIRECTION_SET.has(d)) {
          record.issues.push(`Hướng "${d}" không nằm trong danh sách cho phép`);
        }
        record.direction = d;
      } else if (field === 'note') {
        record.note = cellToString(raw);
      }
    });

    if (!record.title) {
      record.valid = false;
      record.issues.push('Thiếu tên lô đất');
    }
    if (record.issues.length) {
      record.valid = false;
    }

    rows.push(record);
    if (!record.valid) {
      errors.push({ rowIndex: record.rowIndex, issues: record.issues });
    }
  }

  if (!rows.length) {
    return { rows: [], parseError: 'Không có dòng dữ liệu (bỏ qua dòng trống).' };
  }

  markDuplicateTitles(rows);
  for (const row of rows) {
    if (!row.valid) {
      const existing = errors.find((e) => e.rowIndex === row.rowIndex);
      if (existing) existing.issues = row.issues;
      else errors.push({ rowIndex: row.rowIndex, issues: row.issues });
    }
  }

  return { rows, parseError: null, errors, headerRowIndex: headerRowIndex + 1 };
}

export function downloadProjectLotTemplate(): void {
  const headers = PROJECT_LOT_EXCEL_COLUMNS.map((c) => c.label);
  const sample = [['Lô 37', 100, 5, 'Đông', 'Lô này là lô thường']];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 32 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lo dat');
  XLSX.writeFile(wb, 'mau-import-lo-dat-du-an.xlsx');
}

export function formatImportAreaM2(value: number | null | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? `${n} m²` : '—';
}

export function formatImportFrontageM(value: number | null | undefined): string {
  const n = Number(value);
  return Number.isFinite(n) ? `${n} m` : '—';
}
