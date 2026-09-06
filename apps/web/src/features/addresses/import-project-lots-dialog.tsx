'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { AddressKind, formatProjectImportLabel, type AddressListItem } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { listAddresses, importProjectLots } from './api';
import {
  downloadProjectLotTemplate,
  formatImportAreaM2,
  formatImportFrontageM,
  parseProjectLotsExcelFile,
  PROJECT_LOT_EXCEL_COLUMNS,
  PROJECT_LOT_IMPORT_MAX_ROWS,
  type ParsedProjectLotRow,
} from './parse-project-lots-excel';
import './import-project-lots-dialog.css';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Modal import lô kho dự án từ Excel — bố cục / copy khớp CRM cũ. */
export function ImportProjectLotsDialog({ open, onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projects, setProjects] = useState<AddressListItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedProjectLotRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState<{
    created: number;
    total: number;
    failed: number;
  } | null>(null);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const validRows = useMemo(() => rows.filter((r) => r.valid), [rows]);
  const validCount = validRows.length;
  const invalidCount = rows.length - validCount;
  const overImportLimit = validCount > PROJECT_LOT_IMPORT_MAX_ROWS;
  const importFinished = importResult != null;

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setLoadingProjects(true);
    setProjectsError('');

    listAddresses({ kind: AddressKind.PROJECT, withoutLodats: true })
      .then((res) => {
        if (cancelled) return;
        const items = res?.items || [];
        setProjects(items);
        setSelectedProjectId((prev) =>
          prev && items.some((p) => p.id === prev) ? prev : '',
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setProjectsError(err instanceof Error ? err.message : 'Không tải được danh sách dự án.');
        setProjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProjects(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  function resetImportState() {
    setImportError('');
    setImportResult(null);
    setImporting(false);
  }

  function resetFileState() {
    setFileName('');
    setRows([]);
    setParseError('');
    setParsing(false);
    resetImportState();
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function resetAll() {
    setSelectedProjectId('');
    resetFileState();
    setProjectsError('');
  }

  function handleClose() {
    if (importing) return;
    resetAll();
    onClose();
  }

  function handleProjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedProjectId(e.target.value);
    resetFileState();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setParseError('');
    setRows([]);
    resetImportState();

    if (!file) {
      setFileName('');
      return;
    }

    if (!selectedProjectId) {
      setParseError('Vui lòng chọn dự án trước khi chọn file Excel.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setParsing(true);
    try {
      const parsed = await parseProjectLotsExcelFile(file);
      if (parsed.parseError) {
        setParseError(parsed.parseError);
        setRows([]);
      } else {
        setRows(parsed.rows);
      }
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Không đọc được file.');
      setRows([]);
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (
      !selectedProjectId ||
      validCount === 0 ||
      overImportLimit ||
      importing ||
      importFinished
    ) {
      return;
    }

    setImporting(true);
    setImportError('');
    setImportResult(null);

    try {
      const res = await importProjectLots(selectedProjectId, {
        rows: validRows.map((r) => ({
          title: r.title,
          areaM2: r.areaM2,
          frontageM: r.frontageM,
          direction: r.direction || undefined,
          note: r.note || undefined,
        })),
      });

      if (!res?.ok) throw new Error('Import thất bại.');

      setImportResult(res);

      let payloadIdx = 0;
      setRows((prev) =>
        prev.map((row) => {
          if (!row.valid) return row;
          const item = res.results?.[payloadIdx];
          payloadIdx += 1;
          if (!item) return row;
          return {
            ...row,
            importOk: item.ok,
            importMessage: item.ok
              ? item.title
                ? `Đã tạo lô ${item.title}`
                : 'Đã tạo lô'
              : item.message || 'Lỗi',
          };
        }),
      );
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Không import được.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <CrmDialog
      open={open}
      title="Import lô đất dự án từ Excel"
      icon={FileSpreadsheet}
      onClose={handleClose}
      busy={importing}
      className="crm-dialog--wide import-lots-modal"
    >
      <p className="import-lots-hint">
        Chọn <strong>dự án chưa có lô đất</strong>, sau đó chọn file Excel với 5 cột:{' '}
        <strong>{PROJECT_LOT_EXCEL_COLUMNS.map((c) => c.label).join(', ')}</strong> (
        <strong>Tên lô đất</strong> bắt buộc).
      </p>

      <section className="import-lots-section">
        <h3 className="import-lots-section-title">Dự án</h3>
        <select
          className={`import-lots-select${selectedProjectId ? ' active' : ''}`}
          value={selectedProjectId}
          onChange={handleProjectChange}
          disabled={loadingProjects || importing || importFinished}
          aria-label="Chọn dự án"
        >
          <option value="">
            {loadingProjects ? 'Đang tải danh sách dự án…' : '— Chọn dự án —'}
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {formatProjectImportLabel(p)}
            </option>
          ))}
        </select>
        {projectsError ? <p className="crm-form-error">{projectsError}</p> : null}
        {!loadingProjects && !projectsError && projects.length === 0 ? (
          <p className="import-lots-field-hint">
            Không có dự án trống (chưa có lô). Mọi dự án đã có lô hoặc chưa tạo dự án — vào
            Cài đặt → Quản lý địa chỉ để thêm dự án mới.
          </p>
        ) : null}
        {selectedProject ? (
          <p className="import-lots-field-hint">
            Đang chọn: <strong>{formatProjectImportLabel(selectedProject)}</strong>
          </p>
        ) : null}
      </section>

      <section className="import-lots-section">
        <h3 className="import-lots-section-title">File Excel</h3>
        <div className="import-lots-toolbar">
          <button type="button" className="crm-link-btn" onClick={downloadProjectLotTemplate}>
            Tải file mẫu (.xlsx)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="import-lots-file"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="crm-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedProjectId || parsing || importing || importFinished}
          >
            Chọn file Excel…
          </button>
        </div>
        <p className="import-lots-field-hint">
          {!selectedProjectId
            ? 'Chọn dự án trước khi tải file lên.'
            : fileName
              ? `File: ${fileName}`
              : 'Chưa chọn file.'}
        </p>
        <p className="import-lots-field-hint">
          Tối đa <strong>{PROJECT_LOT_IMPORT_MAX_ROWS}</strong> dòng hợp lệ mỗi lần import.
        </p>
        {overImportLimit && !importFinished ? (
          <p className="crm-form-error">
            {`File có ${validCount} dòng hợp lệ — vượt giới hạn ${PROJECT_LOT_IMPORT_MAX_ROWS}. Chia nhỏ file hoặc bỏ bớt dòng lỗi.`}
          </p>
        ) : null}
        {parseError ? <p className="crm-form-error">{parseError}</p> : null}
        {importError ? <p className="crm-form-error">{importError}</p> : null}
      </section>

      <section className="import-lots-section">
        <div className="import-lots-section-head">
          <h3 className="import-lots-section-title">
            Xem trước
            <span className="import-lots-count"> ({rows.length})</span>
          </h3>
        </div>

        {parsing ? <div className="import-lots-empty">Đang đọc file…</div> : null}

        {!parsing ? (
          <div className="import-lots-preview-wrap">
            <table className="import-lots-table">
              <thead>
                <tr>
                  <th>#</th>
                  {PROJECT_LOT_EXCEL_COLUMNS.map((col) => (
                    <th key={col.field}>
                      {col.label}
                      {col.required ? ' *' : ''}
                    </th>
                  ))}
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={PROJECT_LOT_EXCEL_COLUMNS.length + 2}
                      className="import-lots-empty-cell"
                    >
                      {selectedProjectId
                        ? 'Chọn file Excel để xem trước danh sách lô.'
                        : 'Chọn dự án và file Excel để xem trước dữ liệu.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.rowIndex} className={row.valid ? undefined : 'invalid'}>
                      <td>{row.rowIndex}</td>
                      <td>{row.title || '—'}</td>
                      <td>{formatImportAreaM2(row.areaM2)}</td>
                      <td>{formatImportFrontageM(row.frontageM)}</td>
                      <td>{row.direction || '—'}</td>
                      <td>{row.note || '—'}</td>
                      <td>
                        {row.importOk === true ? (
                          <span className="import-lots-ok">{row.importMessage}</span>
                        ) : row.importOk === false ? (
                          <span className="import-lots-issue">{row.importMessage}</span>
                        ) : row.valid ? (
                          <span className="import-lots-ok">OK</span>
                        ) : (
                          <span className="import-lots-issue">{row.issues.join('; ')}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {!parsing && invalidCount > 0 && !importFinished ? (
          <p className="import-lots-summary warn">
            {invalidCount} dòng lỗi (sẽ bỏ qua khi import). {validCount} dòng hợp lệ.
          </p>
        ) : null}

        {importResult ? (
          <p className={`import-lots-summary ${importResult.failed > 0 ? 'warn' : 'ok'}`}>
            Đã tạo <strong>{importResult.created}</strong> / {importResult.total} lô trong dự án.
            {importResult.failed > 0
              ? ` ${importResult.failed} dòng không lưu được — xem cột Trạng thái.`
              : ''}
          </p>
        ) : null}
      </section>

      <div className="import-lots-footer">
        <button type="button" className="crm-btn" onClick={handleClose} disabled={importing}>
          Đóng
        </button>
        <button
          type="button"
          className="crm-btn primary"
          onClick={() => void handleImport()}
          disabled={
            importing ||
            !selectedProjectId ||
            validCount === 0 ||
            overImportLimit ||
            importFinished
          }
        >
          {importing
            ? 'Đang import…'
            : importFinished
              ? 'Đã import'
              : `Import ${validCount > 0 ? `${validCount} lô` : 'lô'}`}
        </button>
      </div>
    </CrmDialog>
  );
}
