'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { TransactionPartyRole, TransactionType } from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import { getTransaction } from './api';
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
  const id = params.id;
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

  return (
    <div className="tx-detail-page">
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
            <h1>{d.code}</h1>
            <div className="tx-detail-badges">
              <CrmBadge tone={typeTone(d.type)}>{typeLabel(d.type)}</CrmBadge>
              <CrmBadge tone={statusTone(d.status)}>{statusLabel(d.status)}</CrmBadge>
            </div>
            <p className="tx-detail-lot">{lotTitle}</p>
          </header>

          <section className="tx-detail-card">
            <h2>Số liệu</h2>
            <dl className="tx-detail-dl">
              <div>
                <dt>Giá bán</dt>
                <dd className="crm-money">{formatMoneyVnd(d.salePriceVnd)}</dd>
              </div>
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
              <div>
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
            <dl className="tx-detail-dl">
              <div>
                <dt>Người bán</dt>
                <dd>
                  {sellers.length
                    ? sellers.map((p) => <div key={p.id}>{p.freeTextName}</div>)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>Người mua</dt>
                <dd>
                  {buyers.length ? buyers.map((p) => <div key={p.id}>{p.freeTextName}</div>) : '—'}
                </dd>
              </div>
            </dl>
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
              {snapshot.images.some((img) => img.url) ? (
                <ul className="tx-detail-photos">
                  {snapshot.images
                    .filter((img) => img.url)
                    .map((img) => (
                      <li key={img.id}>
                        <a
                          href={img.url ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="tx-detail-photo"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url ?? ''}
                            alt=""
                            style={
                              img.rotationDeg
                                ? { transform: `rotate(${img.rotationDeg}deg)` }
                                : undefined
                            }
                          />
                        </a>
                      </li>
                    ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
