'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import {
  TaskTargetType,
  TransactionPartyRole,
  TransactionType,
  type LodatImage,
} from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { CrmAlertDialog, CrmConfirmDialog, CrmToast } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { LodatImageGallery } from '@/features/lodats/components/lodat-image-gallery';
import { useCreateTaskModal } from '@/features/tasks/use-create-task-modal';
import { deleteTransaction, getTransaction } from './api';
import { TransactionDetailFab } from './components/transaction-detail-fab';
import {
  formatCreatedAt,
  formatMoneyVnd,
  getNotaryAppointmentDisplay,
  statusLabel,
  statusTone,
  typeLabel,
  typeTone,
} from './display';
import './transaction-detail.css';
import '@/shared/ui/money.css';

function dash(v?: string | null): string {
  const t = v?.trim();
  return t ? t : '—';
}

export function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params.id;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(null);
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id),
    enabled: Boolean(id),
  });
  const d = q.data ?? null;
  const notary = d ? getNotaryAppointmentDisplay(d) : null;
  const snapshot = d?.snapshot;
  const lotTitle = snapshot?.title?.trim() || d?.lodatTitle?.trim() || '—';
  const sellers = d?.parties.filter((p) => p.role === TransactionPartyRole.SELLER) ?? [];
  const buyers = d?.parties.filter((p) => p.role === TransactionPartyRole.BUYER) ?? [];

  const galleryImages: LodatImage[] = useMemo(() => {
    if (!snapshot?.images?.length) return [];
    return snapshot.images
      .filter((img) => Boolean(img.url))
      .map((img) => ({
        id: img.id,
        url: img.url as string,
        rotationDeg: img.rotationDeg ?? 0,
        source: 'lodat' as const,
      }));
  }, [snapshot?.images]);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  const { openTaskModal, dialog: createTaskDialog } = useCreateTaskModal(() =>
    flash('Đã thêm công việc.'),
  );

  const deleteMut = useMutation({
    mutationFn: () => deleteTransaction(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['transactions'] });
      setConfirmDelete(false);
      router.replace('/giao-dich');
    },
    onError: (err) => {
      setConfirmDelete(false);
      setAlertBox({
        title: 'Không xóa được giao dịch',
        message: err instanceof Error ? err.message : 'Thử lại sau.',
      });
    },
  });

  return (
    <div className={d ? 'tx-detail-page has-fab' : 'tx-detail-page'}>
      <div className="tx-detail-head">
        <Link href="/giao-dich" scroll={false} className="tx-detail-back">
          ← Quản lý giao dịch
        </Link>
        {d ? (
          <Link href={`/giao-dich/${d.id}/sua`} className="tx-detail-edit">
            <Icon icon={Pencil} size={16} /> Sửa
          </Link>
        ) : null}
      </div>

      {q.isLoading ? <p className="tx-detail-state">Đang tải…</p> : null}
      {q.error ? <p className="tx-detail-state error">{(q.error as Error).message}</p> : null}

      {d ? (
        <div className="tx-detail-body">
          <header className="tx-detail-hero">
            <p className="tx-detail-code">{d.code}</p>
            <div className="tx-detail-badges">
              <CrmBadge tone={typeTone(d.type)}>{typeLabel(d.type)}</CrmBadge>
              <CrmBadge tone={statusTone(d.status)}>{statusLabel(d.status)}</CrmBadge>
            </div>
            <h1 className="tx-detail-lot">{lotTitle}</h1>
          </header>

          <section className="tx-detail-card">
            <h2>Số liệu</h2>
            <div className="tx-detail-price-block">
              <span className="tx-detail-price-label">Giá bán</span>
              <strong className="tx-detail-price-value crm-money">
                {formatMoneyVnd(d.salePriceVnd)}
              </strong>
            </div>
            <dl className="tx-detail-dl">
              <div>
                <dt>Thuế</dt>
                <dd className="crm-money">{formatMoneyVnd(d.taxPriceVnd)}</dd>
              </div>
              <div>
                <dt>Hoa hồng</dt>
                <dd className="crm-money">
                  {d.type === TransactionType.RECORD ? '—' : formatMoneyVnd(d.commissionVnd)}
                </dd>
              </div>
              <div className="tx-detail-full">
                <dt>Hẹn công chứng</dt>
                <dd>
                  <span className="tx-detail-notary">
                    {notary?.dateLabel ?? '—'}
                    {notary?.countdownLabel ? (
                      <span className={`tx-notary-count is-${notary.countdownTone}`}>
                        {notary.countdownLabel}
                      </span>
                    ) : null}
                  </span>
                </dd>
              </div>
              <div className="tx-detail-full">
                <dt>Ghi chú</dt>
                <dd>{dash(d.note)}</dd>
              </div>
              {d.cancelReason?.trim() ? (
                <div className="tx-detail-full">
                  <dt>Lý do hủy</dt>
                  <dd>{d.cancelReason}</dd>
                </div>
              ) : null}
              <div>
                <dt>Ngày tạo</dt>
                <dd>{formatCreatedAt(d.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="tx-detail-card">
            <h2>Các bên</h2>
            <div className="tx-detail-parties">
              <div>
                <span className="tx-detail-party-label">Người bán</span>
                <div className="tx-detail-party-names">
                  {sellers.length
                    ? sellers.map((p) => <div key={p.id}>{p.freeTextName}</div>)
                    : '—'}
                </div>
              </div>
              <div className="tx-detail-party-arrow" aria-hidden>
                →
              </div>
              <div>
                <span className="tx-detail-party-label">Người mua</span>
                <div className="tx-detail-party-names">
                  {buyers.length ? buyers.map((p) => <div key={p.id}>{p.freeTextName}</div>) : '—'}
                </div>
              </div>
            </div>
          </section>

          {snapshot ? (
            <section className="tx-detail-card">
              <h2>Lô lúc tạo giao dịch</h2>
              <dl className="tx-detail-dl">
                {snapshot.addressText ? (
                  <div className="tx-detail-full">
                    <dt>Địa chỉ</dt>
                    <dd>{snapshot.addressText}</dd>
                  </div>
                ) : null}
                {snapshot.areaM2 != null || snapshot.frontageM != null || snapshot.direction ? (
                  <div className="tx-detail-full">
                    <dt>DT · MT · Hướng</dt>
                    <dd>
                      {[
                        snapshot.areaM2 != null ? `${snapshot.areaM2} m²` : null,
                        snapshot.frontageM != null ? `MT ${snapshot.frontageM} m` : null,
                        snapshot.direction,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </dd>
                  </div>
                ) : null}
                {snapshot.mapPriceVnd != null ? (
                  <div>
                    <dt>Giá map lúc tạo</dt>
                    <dd className="crm-money">{formatMoneyVnd(snapshot.mapPriceVnd)}</dd>
                  </div>
                ) : null}
                {snapshot.mapPriceNote ? (
                  <div>
                    <dt>Ghi chú giá</dt>
                    <dd>{snapshot.mapPriceNote}</dd>
                  </div>
                ) : null}
              </dl>
              {galleryImages.length > 0 ? (
                <ul className="tx-detail-photos">
                  {galleryImages.map((img, index) => (
                    <li key={img.id ?? img.url}>
                      <button
                        type="button"
                        className="tx-detail-photo"
                        onClick={() => setGalleryIndex(index)}
                        aria-label={`Xem ảnh ${index + 1} / ${galleryImages.length}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt=""
                          style={
                            img.rotationDeg
                              ? { transform: `rotate(${img.rotationDeg}deg)` }
                              : undefined
                          }
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}

      {d ? (
        <TransactionDetailFab
          onAddTask={() => {
            openTaskModal({
              type: TaskTargetType.TRANSACTION,
              id: d.id,
              label: d.code,
            });
          }}
          onEdit={() => {
            router.push(`/giao-dich/${d.id}/sua`);
          }}
          onDelete={() => setConfirmDelete(true)}
        />
      ) : null}

      {galleryIndex != null && galleryImages.length > 0 ? (
        <LodatImageGallery
          title={lotTitle}
          images={galleryImages}
          startIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
          onIndexChange={setGalleryIndex}
        />
      ) : null}

      <CrmConfirmDialog
        open={confirmDelete}
        title="Xóa giao dịch"
        icon={Trash2}
        message={d ? `Bạn có chắc muốn xóa giao dịch ${d.code}?` : ''}
        confirmLabel="Xóa"
        danger
        busy={deleteMut.isPending}
        onCancel={() => {
          if (!deleteMut.isPending) setConfirmDelete(false);
        }}
        onConfirm={() => {
          void deleteMut.mutateAsync();
        }}
      />

      <CrmAlertDialog
        open={Boolean(alertBox)}
        title={alertBox?.title ?? ''}
        icon={AlertTriangle}
        message={alertBox?.message ?? ''}
        onClose={() => setAlertBox(null)}
      />

      {createTaskDialog}
      <CrmToast message={toast} />
    </div>
  );
}
