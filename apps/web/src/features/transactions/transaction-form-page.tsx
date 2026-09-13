'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, UserRoundCheck } from 'lucide-react';
import {
  OPEN_TRANSACTION_EXISTS_CODE,
  TransactionPartyRole,
  TransactionStatus,
  TransactionType,
  UserRole,
  type CreateTransactionInput,
  type TransactionDetail,
  type UpdateTransactionInput,
} from '@crmanhung/shared';
import { ApiError } from '@/shared/api/client';
import { CrmAlertDialog, CrmConfirmDialog, CrmDialog, CrmToast } from '@/shared/ui/dialog';
import { useAuth } from '@/features/auth/auth-context';
import { getLodat } from '@/features/lodats/api';
import {
  createTransaction,
  formatPriceInput,
  getOpenTransaction,
  getTransaction,
  parsePriceInput,
  updateTransaction,
} from './api';
import {
  TransactionFormFields,
  defaultFormValues,
  type TransactionFormParty,
  type TransactionFormValues,
} from './components/transaction-form';
import { emptyParty } from './components/party-fields';
import { dateInputToIso, isoToDateInput, DEFAULT_EXTRA_FILTERS } from './display';
import { peekTransactionListState, saveTransactionListState } from './list-state';
import './transaction-form.css';

function zodMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'issues' in err) {
    const issues = (err as { issues?: { message?: string }[] }).issues;
    if (issues?.[0]?.message) return issues[0].message;
  }
  if (err instanceof Error) return err.message;
  return 'Không lưu được giao dịch.';
}

function existingOpenId(err: unknown): string | null {
  if (!(err instanceof ApiError) || err.code !== OPEN_TRANSACTION_EXISTS_CODE) return null;
  const existing = err.existing as { id?: string } | undefined;
  return existing?.id ?? null;
}

function vndOrEmpty(raw: string): string | undefined {
  const digits = parsePriceInput(raw);
  return digits ? digits : undefined;
}

function cleanParties(rows: TransactionFormParty[]) {
  return rows
    .map((row, i) => ({
      freeTextName: row.freeTextName.trim(),
      customerId: row.customerId?.trim() || '',
      sortOrder: i,
    }))
    .filter((row) => row.freeTextName && row.customerId);
}

function fromDetail(d: TransactionDetail): TransactionFormValues {
  const sellers = d.parties
    .filter((p) => p.role === TransactionPartyRole.SELLER)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p, i) => ({
      key: p.id,
      freeTextName: p.freeTextName,
      customerId: p.customerId ?? null,
      sortOrder: i,
    }));
  const buyers = d.parties
    .filter((p) => p.role === TransactionPartyRole.BUYER)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p, i) => ({
      key: p.id,
      freeTextName: p.freeTextName,
      customerId: p.customerId ?? null,
      sortOrder: i,
    }));
  return {
    type: d.type,
    lodatId: d.lodatId ?? '',
    status: d.status,
    notaryDate: isoToDateInput(d.notaryAppointmentAt),
    salePrice: formatPriceInput(d.salePriceVnd),
    taxPrice: formatPriceInput(d.taxPriceVnd),
    commission: formatPriceInput(d.commissionVnd),
    note: d.note ?? '',
    cancelReason: d.cancelReason ?? '',
    sellers: sellers.length ? sellers : [emptyParty(0)],
    buyers: buyers.length ? buyers : [emptyParty(0)],
  };
}

type Props = { mode: 'create' | 'edit' };

type PendingComplete =
  | { kind: 'confirm'; ownerCustomerId: string; ownerName: string }
  | { kind: 'pick'; buyers: { customerId: string; freeTextName: string }[] };

export function TransactionFormPage({ mode }: Props) {
  const params = useParams<{ id?: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const id = mode === 'edit' ? params.id : undefined;
  const queryLodatId = search.get('lodatId')?.trim() || '';
  const adminBlockedCreate = mode === 'create' && user?.role === UserRole.ADMIN;

  const [values, setValues] = useState<TransactionFormValues>(defaultFormValues());
  const [toast, setToast] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [pendingComplete, setPendingComplete] = useState<PendingComplete | null>(null);
  const [pickedOwnerId, setPickedOwnerId] = useState<string>('');

  const detailQ = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id!),
    enabled: mode === 'edit' && Boolean(id),
  });

  const pickedLodatId = queryLodatId || values.lodatId;
  const lastPrefillLodatRef = useRef('');

  const lodatQ = useQuery({
    queryKey: ['lodat', pickedLodatId],
    queryFn: () => getLodat(pickedLodatId),
    enabled: mode === 'create' && !adminBlockedCreate && Boolean(pickedLodatId),
  });

  const openQ = useQuery({
    queryKey: ['transaction-open', queryLodatId],
    queryFn: () => getOpenTransaction(queryLodatId),
    enabled: mode === 'create' && Boolean(queryLodatId),
  });

  useEffect(() => {
    if (mode === 'edit' && detailQ.data) {
      setValues(fromDetail(detailQ.data));
    }
  }, [mode, detailQ.data]);

  useEffect(() => {
    if (mode !== 'create' || !queryLodatId) return;
    if (openQ.data?.id) {
      router.replace(`/giao-dich/${openQ.data.id}/sua`);
    }
  }, [mode, queryLodatId, openQ.data, router]);

  useEffect(() => {
    if (mode !== 'create' || !pickedLodatId) return;
    if (!lodatQ.data || lodatQ.data.id !== pickedLodatId) return;
    if (lastPrefillLodatRef.current === pickedLodatId) return;
    lastPrefillLodatRef.current = pickedLodatId;
    const owner = lodatQ.data.owner;
    const name = owner?.fullName.trim() ?? '';
    const seller =
      owner && name
        ? [
            {
              key: `owner_${owner.customerId}`,
              freeTextName: name,
              customerId: owner.customerId,
              sortOrder: 0,
            },
          ]
        : [emptyParty(0)];
    setValues((cur) => ({
      ...cur,
      lodatId: pickedLodatId,
      sellers: seller,
    }));
  }, [mode, pickedLodatId, lodatQ.data]);

  const lockedTitle = queryLodatId
    ? lodatQ.data?.title || queryLodatId
    : detailQ.data?.lodatTitle ?? detailQ.data?.snapshot?.title;

  const backHref =
    mode === 'edit' && id
      ? `/giao-dich/${id}`
      : queryLodatId
        ? `/lo-dat/${queryLodatId}`
        : '/giao-dich';

  const saveMut = useMutation({
    mutationFn: async (newOwnerCustomerId?: string) => {
      const sellers = cleanParties(values.sellers);
      const buyers = cleanParties(values.buyers);
      if (!sellers.length) {
        throw new Error('Cần ít nhất một người bán đã chọn từ CRM.');
      }
      if (!buyers.length) {
        throw new Error('Cần ít nhất một người mua đã chọn từ CRM.');
      }
      const notary = dateInputToIso(values.notaryDate);
      if (mode === 'create') {
        if (user?.role === UserRole.ADMIN) {
          throw new Error('Admin không tạo giao dịch. Nhân viên tạo giao dịch từ lô của mình.');
        }
        const lodatId = queryLodatId || values.lodatId;
        if (!lodatId) throw new Error('Chọn lô đất.');
        const body: CreateTransactionInput = {
          lodatId,
          type: values.type,
          notaryAppointmentAt: notary,
          salePriceVnd: vndOrEmpty(values.salePrice) ?? '0',
          taxPriceVnd: vndOrEmpty(values.taxPrice) ?? null,
          commissionVnd:
            values.type === TransactionType.RECORD ? 0 : (vndOrEmpty(values.commission) ?? 0),
          note: values.note.trim() || null,
          sellers,
          buyers,
        };
        return createTransaction(body);
      }
      const body: UpdateTransactionInput = {
        status: values.status,
        cancelReason: values.status === TransactionStatus.HUY ? values.cancelReason.trim() : null,
        notaryAppointmentAt: notary,
        salePriceVnd: vndOrEmpty(values.salePrice) ?? '0',
        taxPriceVnd: vndOrEmpty(values.taxPrice) ?? null,
        commissionVnd:
          values.type === TransactionType.RECORD ? 0 : (vndOrEmpty(values.commission) ?? 0),
        note: values.note.trim() || null,
        sellers,
        buyers,
        ...(newOwnerCustomerId ? { newOwnerCustomerId } : {}),
      };
      return updateTransaction(id!, body);
    },
    onSuccess: async (saved) => {
      setPendingComplete(null);
      setPickedOwnerId('');
      const snap = peekTransactionListState();
      saveTransactionListState(null, {
        searchKeyword: snap?.searchKeyword ?? '',
        type: snap?.type ?? '',
        status: snap?.status ?? '',
        extra: snap?.extra ?? DEFAULT_EXTRA_FILTERS,
        selectedId: saved.id,
      });
      await qc.invalidateQueries({ queryKey: ['transactions'] });
      await qc.invalidateQueries({ queryKey: ['transaction', saved.id] });
      await qc.invalidateQueries({ queryKey: ['lodat'] });
      setToast(`Đã lưu ${saved.code}.`);
      router.push(`/giao-dich/${saved.id}`);
    },
    onError: (err) => {
      const openId = existingOpenId(err);
      if (openId) {
        router.replace(`/giao-dich/${openId}/sua`);
        return;
      }
      setAlertMsg(zodMessage(err));
    },
  });

  function trySubmit() {
    if (mode !== 'edit') {
      saveMut.mutate(undefined);
      return;
    }
    const wasComplete = detailQ.data?.status === TransactionStatus.HOAN_TAT;
    const completing =
      values.status === TransactionStatus.HOAN_TAT &&
      !wasComplete &&
      values.type === TransactionType.OWN &&
      user?.role !== UserRole.ADMIN;

    if (!completing) {
      saveMut.mutate(undefined);
      return;
    }

    const buyers = cleanParties(values.buyers);
    if (!buyers.length) {
      setAlertMsg('Cần ít nhất một người mua đã chọn từ CRM.');
      return;
    }
    if (buyers.length === 1) {
      setPendingComplete({
        kind: 'confirm',
        ownerCustomerId: buyers[0].customerId,
        ownerName: buyers[0].freeTextName,
      });
      return;
    }
    setPickedOwnerId('');
    setPendingComplete({
      kind: 'pick',
      buyers: buyers.map((b) => ({
        customerId: b.customerId,
        freeTextName: b.freeTextName,
      })),
    });
  }

  const heading =
    mode === 'create' ? 'Tạo giao dịch' : `Sửa ${detailQ.data?.code ?? 'giao dịch'}`;
  const missingOwner =
    mode === 'create' &&
    Boolean(pickedLodatId) &&
    lodatQ.isSuccess &&
    !lodatQ.data.owner;

  return (
    <div className="tx-form-page">
      <div className="tx-form-head">
        <Link href={backHref} className="tx-form-back">
          ← Quay lại
        </Link>
        <h1>{heading}</h1>
      </div>

      {detailQ.isLoading || (mode === 'create' && queryLodatId && openQ.isLoading) ? (
        <p className="tx-form-state">Đang tải…</p>
      ) : null}
      {detailQ.error ? (
        <p className="tx-form-state error">{(detailQ.error as Error).message}</p>
      ) : null}
      {lodatQ.error ? (
        <p className="tx-form-state error">{(lodatQ.error as Error).message}</p>
      ) : null}
      {adminBlockedCreate && !openQ.data?.id && (openQ.isFetched || !queryLodatId) ? (
        <p className="tx-form-state error">
          Admin không tạo giao dịch. Nhân viên tạo giao dịch từ lô của mình.
        </p>
      ) : null}
      {missingOwner ? (
        <p className="tx-form-state error">
          Lô này chưa có chủ. Gắn chủ trên chi tiết lô trước khi tạo giao dịch.
        </p>
      ) : null}

      {(mode === 'create' &&
        !adminBlockedCreate &&
        (!queryLodatId || (openQ.isFetched && !openQ.data?.id))) ||
      (mode === 'edit' && detailQ.data) ? (
        <form
          className="tx-form"
          onSubmit={(e) => {
            e.preventDefault();
            trySubmit();
          }}
        >
          <TransactionFormFields
            mode={mode}
            values={values}
            lodatLocked={Boolean(queryLodatId)}
            lodatTitle={lockedTitle}
            busy={saveMut.isPending}
            onChange={setValues}
          />
          <footer className="tx-form-actions">
            <button
              type="button"
              className="tx-form-cancel"
              disabled={saveMut.isPending}
              onClick={() => router.push(backHref)}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="tx-form-save"
              disabled={saveMut.isPending || missingOwner}
            >
              {saveMut.isPending ? 'Đang lưu…' : 'Lưu'}
            </button>
          </footer>
        </form>
      ) : null}

      <CrmConfirmDialog
        open={pendingComplete?.kind === 'confirm'}
        title="Hoàn thành và đổi chủ"
        icon={UserRoundCheck}
        message={
          pendingComplete?.kind === 'confirm'
            ? `Hoàn thành giao dịch và đổi chủ lô sang ${pendingComplete.ownerName}?`
            : ''
        }
        confirmLabel="Hoàn thành"
        cancelLabel="Huỷ"
        busy={saveMut.isPending}
        onCancel={() => setPendingComplete(null)}
        onConfirm={() => {
          if (pendingComplete?.kind !== 'confirm') return;
          saveMut.mutate(pendingComplete.ownerCustomerId);
        }}
      />

      <CrmDialog
        open={pendingComplete?.kind === 'pick'}
        title="Chọn chủ mới"
        icon={UserRoundCheck}
        busy={saveMut.isPending}
        onClose={() => {
          if (saveMut.isPending) return;
          setPendingComplete(null);
          setPickedOwnerId('');
        }}
      >
        <p className="crm-dialog-message">
          Giao dịch có nhiều người mua. Chọn một người làm chủ lô sau khi hoàn thành.
        </p>
        <div className="tx-owner-pick-list" role="radiogroup" aria-label="Người mua làm chủ mới">
          {pendingComplete?.kind === 'pick'
            ? pendingComplete.buyers.map((b) => (
                <label key={b.customerId} className="tx-owner-pick-item">
                  <input
                    type="radio"
                    name="new-owner"
                    value={b.customerId}
                    checked={pickedOwnerId === b.customerId}
                    disabled={saveMut.isPending}
                    onChange={() => setPickedOwnerId(b.customerId)}
                  />
                  <span>{b.freeTextName}</span>
                </label>
              ))
            : null}
        </div>
        <div className="crm-dialog-actions">
          <button
            type="button"
            className="crm-btn"
            disabled={saveMut.isPending}
            onClick={() => {
              setPendingComplete(null);
              setPickedOwnerId('');
            }}
          >
            Huỷ
          </button>
          <button
            type="button"
            className="crm-btn primary"
            disabled={saveMut.isPending || !pickedOwnerId}
            onClick={() => {
              if (!pickedOwnerId) return;
              saveMut.mutate(pickedOwnerId);
            }}
          >
            {saveMut.isPending ? 'Đang lưu…' : 'Hoàn thành'}
          </button>
        </div>
      </CrmDialog>

      <CrmAlertDialog
        open={Boolean(alertMsg)}
        title="Không lưu được"
        icon={AlertTriangle}
        message={alertMsg ?? ''}
        onClose={() => setAlertMsg(null)}
      />
      <CrmToast message={toast} />
    </div>
  );
}
