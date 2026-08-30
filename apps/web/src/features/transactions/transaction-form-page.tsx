'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import {
  OPEN_TRANSACTION_EXISTS_CODE,
  TransactionPartyRole,
  TransactionStatus,
  TransactionType,
  type CreateTransactionInput,
  type TransactionDetail,
  type UpdateTransactionInput,
} from '@crmanhung/shared';
import { ApiError } from '@/shared/api/client';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { getLodat, listLodats } from '@/features/lodats/api';
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

function cleanParties(rows: TransactionFormValues['sellers']) {
  return rows
    .map((row, i) => ({
      freeTextName: row.freeTextName.trim(),
      customerId: row.customerId || null,
      sortOrder: i,
    }))
    .filter((row) => row.freeTextName);
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

export function TransactionFormPage({ mode }: Props) {
  const params = useParams<{ id?: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = mode === 'edit' ? params.id : undefined;
  const queryLodatId = search.get('lodatId')?.trim() || '';

  const [values, setValues] = useState<TransactionFormValues>(defaultFormValues);
  const [toast, setToast] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

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
    enabled: mode === 'create' && Boolean(pickedLodatId),
  });

  const lodatsQ = useQuery({
    queryKey: ['lodats', 'tx-picker'],
    queryFn: () => listLodats({ limit: 200, includePaused: true }),
    enabled: mode === 'create' && !queryLodatId,
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
    const seller = owner && name
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

  const lodatOptions = useMemo(
    () => (lodatsQ.data?.items ?? []).map((l) => ({ id: l.id, title: l.title })),
    [lodatsQ.data],
  );

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
    mutationFn: async () => {
      const sellers = cleanParties(values.sellers);
      const buyers = cleanParties(values.buyers);
      const notary = dateInputToIso(values.notaryDate);
      if (mode === 'create') {
        const lodatId = queryLodatId || values.lodatId;
        if (!lodatId) throw new Error('Chọn lô đất.');
        const body: CreateTransactionInput = {
          lodatId,
          type: values.type,
          notaryAppointmentAt: notary,
          salePriceVnd: vndOrEmpty(values.salePrice) ?? '0',
          taxPriceVnd: vndOrEmpty(values.taxPrice) ?? null,
          commissionVnd: values.type === TransactionType.RECORD ? 0 : (vndOrEmpty(values.commission) ?? 0),
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
        commissionVnd: values.type === TransactionType.RECORD ? 0 : (vndOrEmpty(values.commission) ?? 0),
        note: values.note.trim() || null,
        sellers,
        buyers,
      };
      return updateTransaction(id!, body);
    },
    onSuccess: async (saved) => {
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
      {detailQ.error ? <p className="tx-form-state error">{(detailQ.error as Error).message}</p> : null}
      {lodatQ.error ? <p className="tx-form-state error">{(lodatQ.error as Error).message}</p> : null}
      {missingOwner ? (
        <p className="tx-form-state error">
          Lô này chưa có chủ. Gắn chủ trên chi tiết lô trước khi tạo giao dịch.
        </p>
      ) : null}

      {(mode === 'create' && (!queryLodatId || (openQ.isFetched && !openQ.data?.id))) ||
      (mode === 'edit' && detailQ.data) ? (
        <form
          className="tx-form"
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
        >
          <TransactionFormFields
            mode={mode}
            values={values}
            lodatOptions={lodatOptions}
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
            <button type="submit" className="tx-form-save" disabled={saveMut.isPending || missingOwner}>
              {saveMut.isPending ? 'Đang lưu…' : 'Lưu'}
            </button>
          </footer>
        </form>
      ) : null}

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
