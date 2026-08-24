'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ADDRESS_KIND_LABELS,
  AddressKind,
  formatAddressLabel,
  type AddressListItem,
  type AdminUnitItem,
} from '@crmanhung/shared';
import { MapPin, Plus } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';
import { CrmAlertDialog, CrmConfirmDialog, CrmToast } from '@/shared/ui/dialog';
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

export function AddressBookPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [keyword, setKeyword] = useState('');
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.replace('/khach-hang');
    }
  }, [authLoading, user, router]);

  const listQuery = useQuery({
    queryKey: ['addresses', keyword, kindFilter],
    queryFn: () =>
      listAddresses({
        keyword: keyword.trim() || undefined,
        kind: kindFilter || undefined,
      }),
    enabled: user?.role === 'ADMIN',
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    void listProvinces().then((res) => setProvinces(res.items));
  }, [user?.role]);

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

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        kind: form.kind,
        wardId: form.wardId,
        detail: form.detail.trim() || null,
        description: form.description.trim() || null,
      };
      if (editing) {
        return updateAddress(editing.id, payload);
      }
      return createAddress(payload);
    },
    onSuccess: async () => {
      setToast(editing ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ.');
      setEditing(null);
      setForm(EMPTY_FORM);
      setFormError(null);
      await qc.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Không lưu được địa chỉ.');
    },
  });

  const hideMut = useMutation({
    mutationFn: (id: string) => hideAddress(id),
    onSuccess: async () => {
      setHideTarget(null);
      setToast('Đã ẩn địa chỉ.');
      await qc.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: unknown) => {
      setHideTarget(null);
      setAlertBox({
        title: 'Không ẩn được',
        message: err instanceof Error ? err.message : 'Thử lại sau.',
      });
    },
  });

  const counters = useMemo(() => {
    const items = listQuery.data?.items ?? [];
    return {
      all: items.length,
      regular: items.filter((i) => i.kind === AddressKind.REGULAR).length,
      project: items.filter((i) => i.kind === AddressKind.PROJECT).length,
    };
  }, [listQuery.data?.items]);

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
  }

  function resetForm() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  if (authLoading || !user || user.role !== 'ADMIN') {
    return <div className="boot-screen">Đang tải…</div>;
  }

  const detailLabel =
    form.kind === AddressKind.PROJECT ? 'Tên dự án *' : 'Thôn / Tổ (tuỳ chọn)';

  return (
    <div className="addr-page">
      <header className="addr-page-head">
        <div>
          <h1>
            <Icon icon={MapPin} size="sm" /> Quản lý địa chỉ
          </h1>
          <p>Sổ dùng chung — chỉ Admin thêm / sửa. Nhân viên chỉ chọn khi tạo lô.</p>
        </div>
      </header>

      <div className="addr-toolbar">
        <input
          className="addr-search"
          placeholder="Tìm tỉnh, huyện, xã, thôn, dự án…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className="addr-kind-tabs" role="tablist">
          {(
            [
              ['', 'Tất cả', counters.all],
              [AddressKind.REGULAR, 'Đất dân', counters.regular],
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

      <div className="addr-layout">
        <section className="addr-list-panel" aria-label="Danh sách địa chỉ">
          {listQuery.isLoading ? <p className="crm-form-hint">Đang tải…</p> : null}
          {listQuery.isError ? (
            <p className="crm-form-error">
              {listQuery.error instanceof Error
                ? listQuery.error.message
                : 'Không tải được danh sách.'}
            </p>
          ) : null}
          <ul className="addr-list">
            {(listQuery.data?.items ?? []).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={editing?.id === item.id ? 'is-selected' : undefined}
                  onClick={() => selectForEdit(item)}
                >
                  <span
                    className={
                      item.kind === AddressKind.PROJECT
                        ? 'addr-kind-tag is-project'
                        : 'addr-kind-tag'
                    }
                  >
                    {ADDRESS_KIND_LABELS[item.kind]}
                  </span>
                  <strong>{formatAddressLabel(item)}</strong>
                  {item.kind === AddressKind.PROJECT ? (
                    <em>{item.imageCount} ảnh · {item.lodatCount} lô</em>
                  ) : (
                    <em>{item.lodatCount} lô gắn</em>
                  )}
                </button>
                <button
                  type="button"
                  className="addr-hide-btn"
                  onClick={() => setHideTarget(item)}
                >
                  Ẩn
                </button>
              </li>
            ))}
          </ul>
          {!listQuery.isLoading && (listQuery.data?.items.length ?? 0) === 0 ? (
            <p className="crm-form-hint">Chưa có địa chỉ.</p>
          ) : null}
        </section>

        <section className="addr-form-panel" aria-label="Form địa chỉ">
          <div className="addr-form-head">
            <h2>{editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}</h2>
            {editing ? (
              <button type="button" className="crm-btn" onClick={resetForm}>
                Thêm mới
              </button>
            ) : null}
          </div>

          <label className="addr-check">
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
            Là dự án
          </label>

          <UnitSelect
            label="Tỉnh / Thành phố *"
            value={form.provinceId}
            options={provinces}
            disabled={unitBusy}
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
                setProvinces((p) => [...p, res.item].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
                setForm((f) => ({
                  ...f,
                  provinceId: res.item.id,
                  districtId: '',
                  wardId: '',
                }));
              } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Không thêm được tỉnh.');
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
                setDistricts((p) => [...p, res.item].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
                setForm((f) => ({ ...f, districtId: res.item.id, wardId: '' }));
              } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Không thêm được huyện.');
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
            onChange={(id) => setForm((f) => ({ ...f, wardId: id }))}
            onCreate={async (name) => {
              if (!form.districtId) return;
              setUnitBusy(true);
              try {
                const res = await createWard(form.districtId, name);
                setWards((p) => [...p, res.item].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
                setForm((f) => ({ ...f, wardId: res.item.id }));
              } catch (err) {
                setFormError(err instanceof Error ? err.message : 'Không thêm được xã.');
              } finally {
                setUnitBusy(false);
              }
            }}
          />

          <label>
            {detailLabel}
            <input
              value={form.detail}
              maxLength={200}
              placeholder={
                form.kind === AddressKind.PROJECT
                  ? 'VD: Khu đô thị Vạn Phúc'
                  : 'VD: Tổ 5'
              }
              onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))}
            />
          </label>

          <label>
            Ghi chú
            <textarea
              value={form.description}
              maxLength={2000}
              rows={3}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>

          {form.kind === AddressKind.PROJECT ? (
            <p className="crm-form-hint">
              Ảnh dự án: thêm sau khi lưu địa chỉ (upload API đã sẵn — gallery UI sẽ bổ sung).
            </p>
          ) : null}

          {formError ? <p className="crm-form-error">{formError}</p> : null}

          <div className="addr-form-actions">
            <button
              type="button"
              className="crm-btn crm-btn-primary"
              disabled={saveMut.isPending || unitBusy}
              onClick={() => {
                setFormError(null);
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
              {saveMut.isPending ? 'Đang lưu…' : editing ? 'Cập nhật' : 'Thêm địa chỉ'}
            </button>
          </div>
        </section>
      </div>

      <CrmConfirmDialog
        open={Boolean(hideTarget)}
        title="Ẩn địa chỉ?"
        message={
          hideTarget
            ? `Ẩn «${formatAddressLabel(hideTarget)}»? Lô đang gắn không bị xoá.`
            : ''
        }
        confirmLabel="Ẩn"
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
    </div>
  );
}

function UnitSelect({
  label,
  value,
  options,
  disabled,
  onChange,
  onCreate,
}: {
  label: string;
  value: string;
  options: AdminUnitItem[];
  disabled?: boolean;
  onChange: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <div className="addr-unit-field">
      <label>
        {label}
        <div className="addr-unit-row">
          <select
            value={value}
            disabled={disabled || busy}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">— Chọn —</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="crm-btn"
            disabled={disabled || busy}
            title="Thêm"
            onClick={() => setAdding((v) => !v)}
          >
            <Icon icon={Plus} size="sm" />
          </button>
        </div>
      </label>
      {adding ? (
        <div className="addr-unit-add">
          <input
            value={name}
            placeholder="Tên mới"
            maxLength={120}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="button"
            className="crm-btn crm-btn-primary"
            disabled={busy || !name.trim()}
            onClick={() => {
              setBusy(true);
              void onCreate(name.trim())
                .then(() => {
                  setName('');
                  setAdding(false);
                })
                .finally(() => setBusy(false));
            }}
          >
            Lưu
          </button>
        </div>
      ) : null}
    </div>
  );
}
