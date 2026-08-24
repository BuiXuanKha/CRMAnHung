'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AddressKind,
  formatAddressLabel,
  type AddressListItem,
  type AdminUnitItem,
} from '@crmanhung/shared';
import { MapPin, Plus, X } from 'lucide-react';
import { CrmAlertDialog, CrmConfirmDialog, CrmDialog, CrmToast } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import {
  createAddress,
  createDistrict,
  createProvince,
  createWard,
  hideAddress,
  listAddresses,
  listDistricts,
  listProvinces,
  listWards,
  updateAddress,
} from './api';
import './addresses.css';

type KindFilter = '' | AddressKind;

type FormState = {
  kind: AddressKind;
  provinceId: string;
  districtId: string;
  wardId: string;
  detail: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  kind: AddressKind.REGULAR,
  provinceId: '',
  districtId: '',
  wardId: '',
  detail: '',
  description: '',
};

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Modal quản lý địa chỉ — bố cục giống CRM cũ: Tìm kiếm → List → Form. */
export function AddressesManageDialog({ open, onClose }: Props) {
  const qc = useQueryClient();

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('');
  const [editing, setEditing] = useState<AddressListItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(
    null,
  );
  const [hideTarget, setHideTarget] = useState<AddressListItem | null>(null);

  const [provinces, setProvinces] = useState<AdminUnitItem[]>([]);
  const [districts, setDistricts] = useState<AdminUnitItem[]>([]);
  const [wards, setWards] = useState<AdminUnitItem[]>([]);
  const [unitBusy, setUnitBusy] = useState(false);
  const formSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 200);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    if (!open) return;
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setKeyword('');
    setDebouncedKeyword('');
    setKindFilter('');
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const listQuery = useQuery({
    queryKey: ['addresses', debouncedKeyword],
    queryFn: () =>
      listAddresses({
        keyword: debouncedKeyword || undefined,
      }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    void listProvinces().then((res) => setProvinces(res.items));
  }, [open]);

  useEffect(() => {
    if (!form.provinceId) {
      setDistricts([]);
      setWards([]);
      return;
    }
    let cancelled = false;
    void listDistricts(form.provinceId).then((res) => {
      if (!cancelled) setDistricts(res.items);
    });
    return () => {
      cancelled = true;
    };
  }, [form.provinceId]);

  useEffect(() => {
    if (!form.districtId) {
      setWards([]);
      return;
    }
    let cancelled = false;
    void listWards(form.districtId).then((res) => {
      if (!cancelled) setWards(res.items);
    });
    return () => {
      cancelled = true;
    };
  }, [form.districtId]);

  const allItems = listQuery.data?.items ?? [];
  const visibleItems = useMemo(() => {
    if (!kindFilter) return allItems;
    return allItems.filter((i) => i.kind === kindFilter);
  }, [allItems, kindFilter]);

  const counters = useMemo(
    () => ({
      all: allItems.length,
      regular: allItems.filter((i) => i.kind === AddressKind.REGULAR).length,
      project: allItems.filter((i) => i.kind === AddressKind.PROJECT).length,
    }),
    [allItems],
  );

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        kind: form.kind,
        wardId: form.wardId,
        detail: form.detail.trim() || null,
        description: form.description.trim() || null,
      };
      if (editing) return updateAddress(editing.id, payload);
      return createAddress(payload);
    },
    onSuccess: async () => {
      setToast(editing ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ.');
      resetForm();
      await qc.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Không lưu được địa chỉ.');
    },
  });

  const hideMut = useMutation({
    mutationFn: (id: string) => hideAddress(id),
    onSuccess: async (_data, id) => {
      setHideTarget(null);
      setToast('Đã xoá địa chỉ.');
      if (editing?.id === id) resetForm();
      await qc.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: unknown) => {
      setHideTarget(null);
      setAlertBox({
        title: 'Không xoá được',
        message: err instanceof Error ? err.message : 'Thử lại sau.',
      });
    },
  });

  function resetForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function selectForEdit(item: AddressListItem) {
    setEditing(item);
    setFormError(null);
    setForm({
      kind: item.kind,
      provinceId: item.provinceId,
      districtId: item.districtId,
      wardId: item.wardId,
      detail: item.detail ?? '',
      description: item.description ?? '',
    });
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  function detailLabel(item: AddressListItem): string {
    const detail = String(item.detail || '').trim();
    if (item.kind === AddressKind.PROJECT) {
      const count = Number(item.lodatCount) || 0;
      return detail ? `${detail} (${count} lô)` : `(${count} lô)`;
    }
    return detail || '—';
  }

  const formDetailLabel =
    form.kind === AddressKind.PROJECT ? 'Tên dự án *' : 'Thôn / Tổ (tuỳ chọn)';
  const formDetailPlaceholder =
    form.kind === AddressKind.PROJECT ? 'VD: Khu đô thị Vạn Phúc' : 'VD: Tổ 5';
  const busy = saveMut.isPending || hideMut.isPending || unitBusy;
  const nestedOpen = Boolean(hideTarget) || Boolean(alertBox);

  return (
    <>
      <CrmDialog
        open={open}
        title="Quản lý địa chỉ"
        icon={MapPin}
        onClose={onClose}
        busy={busy || nestedOpen}
        className="crm-dialog--wide addr-modal"
      >
        {/* === TÌM KIẾM ================================================= */}
        <section className="addr-section">
          <div className="addr-section-head">
            <h3 className="addr-section-title">Tìm kiếm</h3>
          </div>
          <div className="addr-toolbar">
            <div className="addr-search-wrap">
              <input
                type="search"
                enterKeyHint="search"
                className="addr-search"
                placeholder="Tìm theo tỉnh, huyện, xã, thôn, dự án…"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="Tìm địa chỉ"
              />
            </div>
            <div className="addr-kind-tabs" role="tablist" aria-label="Lọc theo loại địa chỉ">
              {(
                [
                  ['', 'Tất cả', counters.all],
                  [AddressKind.REGULAR, 'Thường', counters.regular],
                  [AddressKind.PROJECT, 'Dự án', counters.project],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={kindFilter === value}
                  className={kindFilter === value ? 'is-active' : undefined}
                  onClick={() => setKindFilter(value)}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* === DANH SÁCH ================================================ */}
        <section className="addr-section">
          <div className="addr-section-head">
            <h3 className="addr-section-title">
              Danh sách địa chỉ
              <span className="addr-section-count">({visibleItems.length})</span>
            </h3>
          </div>

          {listQuery.isError ? (
            <p className="crm-form-error">
              {listQuery.error instanceof Error
                ? listQuery.error.message
                : 'Không tải được danh sách.'}
            </p>
          ) : null}

          <div className="addr-list-wrap">
            {listQuery.isLoading && visibleItems.length === 0 ? (
              <div className="addr-empty">Đang tải…</div>
            ) : visibleItems.length === 0 ? (
              <div className="addr-empty">
                {debouncedKeyword || kindFilter
                  ? 'Không có địa chỉ nào khớp bộ lọc.'
                  : 'Chưa có địa chỉ nào. Điền form bên dưới để tạo mới.'}
              </div>
            ) : (
              <ul className="addr-list">
                {visibleItems.map((item) => {
                  const isActive = editing?.id === item.id;
                  return (
                    <li
                      key={item.id}
                      className={['addr-list-item', isActive ? 'is-active' : '']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className="addr-item-main"
                        onClick={() => selectForEdit(item)}
                        aria-label={`Sửa ${formatAddressLabel(item)}`}
                      >
                        <span
                          className={
                            item.kind === AddressKind.PROJECT
                              ? 'addr-kind-badge is-project'
                              : 'addr-kind-badge is-regular'
                          }
                        >
                          {item.kind === AddressKind.PROJECT ? 'Dự án' : 'Thường'}
                        </span>
                        <span className="addr-item-text">
                          <span className="addr-item-primary">{detailLabel(item)}</span>
                          <span className="addr-item-secondary">
                            {[item.ward, item.district, item.province]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                          {item.description ? (
                            <span className="addr-item-desc">{item.description}</span>
                          ) : null}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="addr-delete-btn"
                        onClick={() => setHideTarget(item)}
                        aria-label="Xoá"
                        title="Xoá địa chỉ"
                      >
                        Xoá
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* === FORM ===================================================== */}
        <section className="addr-section" ref={formSectionRef} id="addresses-form-section">
          <div className="addr-section-head">
            <h3 className="addr-section-title">
              {editing ? 'Đang sửa địa chỉ' : 'Thêm địa chỉ mới'}
              {editing ? (
                <span className="addr-editing-tag">
                  {formatAddressLabel(editing)}
                </span>
              ) : null}
            </h3>
            {editing ? (
              <button
                type="button"
                className="crm-link-btn"
                onClick={resetForm}
                disabled={busy}
              >
                Huỷ chọn → tạo mới
              </button>
            ) : null}
          </div>

          {formError ? <p className="crm-form-error">{formError}</p> : null}

          <label className="addr-project-check">
            <input
              type="checkbox"
              checked={form.kind === AddressKind.PROJECT}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kind: e.target.checked ? AddressKind.PROJECT : AddressKind.REGULAR,
                }))
              }
            />
            <span>Là dự án</span>
            <small>
              Tick nếu địa chỉ này là một dự án bất động sản (cần Tên dự án).
            </small>
          </label>

          <div className="addr-form-grid">
            <UnitSelect
              label="Tỉnh / Thành phố *"
              value={form.provinceId}
              options={provinces}
              disabled={unitBusy}
              placeholder="— Chọn tỉnh —"
              disabledHint=""
              addPromptLabel="Tên tỉnh / thành phố mới"
              onChange={(id) =>
                setForm((f) => ({
                  ...f,
                  provinceId: id,
                  districtId: '',
                  wardId: '',
                }))
              }
              onCreate={async (name) => {
                setUnitBusy(true);
                try {
                  const res = await createProvince({ name });
                  setProvinces((p) =>
                    [...p, res.item].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
                  );
                  setForm((f) => ({
                    ...f,
                    provinceId: res.item.id,
                    districtId: '',
                    wardId: '',
                  }));
                } catch (err) {
                  setFormError(
                    err instanceof Error ? err.message : 'Không thêm được tỉnh.',
                  );
                  throw err;
                } finally {
                  setUnitBusy(false);
                }
              }}
            />

            <UnitSelect
              label="Huyện / Quận *"
              value={form.districtId}
              options={districts}
              disabled={!form.provinceId || unitBusy}
              placeholder="— Chọn huyện —"
              disabledHint="Chọn Tỉnh trước"
              addPromptLabel="Tên huyện / quận mới"
              onChange={(id) =>
                setForm((f) => ({
                  ...f,
                  districtId: id,
                  wardId: '',
                }))
              }
              onCreate={async (name) => {
                if (!form.provinceId) return;
                setUnitBusy(true);
                try {
                  const res = await createDistrict(form.provinceId, name);
                  setDistricts((p) =>
                    [...p, res.item].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
                  );
                  setForm((f) => ({ ...f, districtId: res.item.id, wardId: '' }));
                } catch (err) {
                  setFormError(
                    err instanceof Error ? err.message : 'Không thêm được huyện.',
                  );
                  throw err;
                } finally {
                  setUnitBusy(false);
                }
              }}
            />

            <UnitSelect
              label="Xã / Phường *"
              value={form.wardId}
              options={wards}
              disabled={!form.districtId || unitBusy}
              placeholder="— Chọn xã —"
              disabledHint="Chọn Huyện trước"
              addPromptLabel="Tên xã / phường mới"
              onChange={(id) => setForm((f) => ({ ...f, wardId: id }))}
              onCreate={async (name) => {
                if (!form.districtId) return;
                setUnitBusy(true);
                try {
                  const res = await createWard(form.districtId, name);
                  setWards((p) =>
                    [...p, res.item].sort((a, b) => a.name.localeCompare(b.name, 'vi')),
                  );
                  setForm((f) => ({ ...f, wardId: res.item.id }));
                } catch (err) {
                  setFormError(
                    err instanceof Error ? err.message : 'Không thêm được xã.',
                  );
                  throw err;
                } finally {
                  setUnitBusy(false);
                }
              }}
            />

            <label className="addr-field">
              {formDetailLabel}
              <input
                value={form.detail}
                maxLength={200}
                placeholder={formDetailPlaceholder}
                onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
              />
            </label>
          </div>

          <label className="addr-field">
            Mô tả (tuỳ chọn)
            <textarea
              value={form.description}
              maxLength={2000}
              rows={3}
              placeholder={
                form.kind === AddressKind.PROJECT
                  ? 'Quy mô, vị trí, tiến độ, pháp lý…'
                  : 'Ghi chú vị trí, mốc dễ tìm…'
              }
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>

          {form.kind === AddressKind.PROJECT ? (
            <p className="crm-form-hint">
              Ảnh dự án: thêm sau khi lưu địa chỉ (gallery upload sẽ bổ sung).
            </p>
          ) : null}

          <div className="addr-form-actions">
            <button
              type="button"
              className="crm-btn"
              disabled={busy}
              onClick={resetForm}
            >
              {editing ? 'Huỷ chọn' : 'Đặt lại'}
            </button>
            <button
              type="button"
              className="crm-btn primary"
              disabled={busy}
              onClick={() => {
                setFormError(null);
                if (!form.provinceId) {
                  setFormError('Chọn Tỉnh / Thành phố.');
                  return;
                }
                if (!form.districtId) {
                  setFormError('Chọn Huyện / Quận.');
                  return;
                }
                if (!form.wardId) {
                  setFormError('Chọn Xã / Phường.');
                  return;
                }
                if (form.kind === AddressKind.PROJECT && !form.detail.trim()) {
                  setFormError('Nhập Tên dự án.');
                  return;
                }
                saveMut.mutate();
              }}
            >
              {saveMut.isPending
                ? 'Đang lưu…'
                : editing
                  ? 'Cập nhật'
                  : 'Thêm địa chỉ'}
            </button>
          </div>
        </section>
      </CrmDialog>

      <CrmConfirmDialog
        open={Boolean(hideTarget)}
        title="Xoá địa chỉ?"
        message={
          hideTarget
            ? `Xoá «${formatAddressLabel(hideTarget)}» khỏi danh sách? (xoá mềm, có thể khôi phục sau)`
            : ''
        }
        confirmLabel="Xoá"
        danger
        busy={hideMut.isPending}
        onCancel={() => setHideTarget(null)}
        onConfirm={() => {
          if (hideTarget) hideMut.mutate(hideTarget.id);
        }}
      />
      <CrmAlertDialog
        open={Boolean(alertBox)}
        title={alertBox?.title ?? ''}
        message={alertBox?.message ?? ''}
        onClose={() => setAlertBox(null)}
      />
      <CrmToast message={toast} />
    </>
  );
}

function UnitSelect({
  label,
  value,
  options,
  disabled,
  placeholder,
  disabledHint,
  addPromptLabel,
  onChange,
  onCreate,
}: {
  label: string;
  value: string;
  options: AdminUnitItem[];
  disabled?: boolean;
  placeholder: string;
  disabledHint: string;
  addPromptLabel: string;
  onChange: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [addError, setAddError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  useEffect(() => {
    if (disabled && adding) {
      setAdding(false);
      setName('');
      setAddError('');
    }
  }, [disabled, adding]);

  async function submitAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      setAddError('Nhập tên.');
      return;
    }
    setBusy(true);
    setAddError('');
    try {
      await onCreate(trimmed);
      setName('');
      setAdding(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Không thêm được.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="addr-unit-field">
      <span className="addr-field-label">{label}</span>
      <div className="addr-unit-row">
        <select
          value={value}
          disabled={disabled || busy}
          title={disabled ? disabledHint : undefined}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {disabled ? disabledHint || placeholder : placeholder}
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="addr-unit-add-btn"
          disabled={disabled || busy}
          title={disabled ? disabledHint : 'Thêm mới'}
          onClick={() => setAdding((v) => !v)}
        >
          {adding ? (
            <Icon icon={X} size="sm" />
          ) : (
            <>
              <Icon icon={Plus} size="sm" />
              Thêm
            </>
          )}
        </button>
      </div>
      {adding ? (
        <div className="addr-unit-add-panel">
          <input
            ref={inputRef}
            value={name}
            placeholder={addPromptLabel}
            maxLength={120}
            disabled={busy}
            onChange={(e) => {
              setName(e.target.value);
              if (addError) setAddError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void submitAdd();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setAdding(false);
                setName('');
                setAddError('');
              }
            }}
          />
          <button
            type="button"
            className="addr-unit-add-confirm"
            disabled={busy}
            onClick={() => void submitAdd()}
          >
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
          {addError ? <div className="addr-unit-add-error">{addError}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
