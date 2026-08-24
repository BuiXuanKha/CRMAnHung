'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Copy, Phone, SquarePen, X } from 'lucide-react';
import {
  LodatSaleStatus,
  UserRole,
  type LodatDetail,
  type LodatListingStatus,
} from '@crmanhung/shared';
import { useAuth } from '@/features/auth/auth-context';
import { CrmBadge } from '@/shared/ui/badge';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { getLodat, updateLodatSaleStatus } from './api';
import { SaleToggle } from './components/sale-toggle';
import { buildLodatCopyText, copyTextToClipboard } from './copy-text';
import {
  formatArea,
  formatFrontageDir,
  formatPriceVnd,
  kindLabel,
  kindTone,
} from './display';
import './lodats.css';
import './lodat-detail.css';
import '@/shared/ui/money.css';

const SWIPE_PX = 48;

export function LodatDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [heroIdx, setHeroIdx] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const q = useQuery({
    queryKey: ['lodat', id],
    queryFn: () => getLodat(id),
    enabled: Boolean(id),
  });

  const detail = q.data ?? null;
  const images = detail?.imageUrls?.length
    ? detail.imageUrls
    : detail?.coverImageUrl
      ? [detail.coverImageUrl]
      : [];
  const imageCount = images.length;

  useEffect(() => {
    setHeroIdx(0);
  }, [id, imageCount]);

  const goPrev = useCallback(() => {
    if (imageCount < 2) return;
    setHeroIdx((i) => (i - 1 + imageCount) % imageCount);
  }, [imageCount]);

  const goNext = useCallback(() => {
    if (imageCount < 2) return;
    setHeroIdx((i) => (i + 1) % imageCount);
  }, [imageCount]);

  const toggleMut = useMutation({
    mutationFn: (plot: LodatDetail) => {
      const next: LodatListingStatus =
        plot.status === LodatSaleStatus.DANG_BAN
          ? LodatSaleStatus.TAM_DUNG
          : LodatSaleStatus.DANG_BAN;
      return updateLodatSaleStatus(plot.id, { status: next });
    },
    onSuccess: async (updated) => {
      await qc.invalidateQueries({ queryKey: ['lodat', id] });
      await qc.invalidateQueries({ queryKey: ['lodats'] });
      flash(
        updated.status === LodatSaleStatus.TAM_DUNG
          ? `Đã tạm dừng «${updated.title}».`
          : `Đã mở bán «${updated.title}».`,
      );
    },
    onError: (err: Error) => setAlertMsg(err.message),
  });

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }

  async function handleCopy() {
    if (!detail) return;
    try {
      await copyTextToClipboard(buildLodatCopyText(detail));
      flash('Đã copy thông tin lô đất.');
    } catch {
      setAlertMsg('Không copy được thông tin lô đất.');
    }
  }

  const heroUrl = images[heroIdx] ?? images[0] ?? '';

  return (
    <div className={['ld-detail-page', detail ? 'has-mobile-footer' : ''].filter(Boolean).join(' ')}>
      <Link href="/lo-dat" className="ld-detail-back">
        ← Danh sách lô đất
      </Link>

      {q.isLoading ? <p className="ld-detail-state">Đang tải…</p> : null}
      {q.error ? <p className="ld-detail-error">{(q.error as Error).message}</p> : null}

      {detail ? (
        <div className="ld-detail-layout">
          <header className="ld-detail-header">
            <div className="ld-detail-header-text">
              <h1 className="ld-detail-title">{detail.title}</h1>
              {detail.address ? (
                <p className="ld-detail-address">{detail.address}</p>
              ) : null}
              <div className="ld-detail-kind">
                <CrmBadge tone={kindTone(detail.kind)}>{kindLabel(detail.kind)}</CrmBadge>
                {detail.projectLotId ? (
                  <CrmBadge tone="gray">Dự án</CrmBadge>
                ) : (
                  <CrmBadge tone="gray">Đất dân</CrmBadge>
                )}
              </div>
            </div>
            <div className="ld-detail-header-actions">
              {!isAdmin ? (
                <SaleToggle
                  title={detail.title}
                  status={detail.status}
                  busy={toggleMut.isPending}
                  onToggle={() => {
                    if (!toggleMut.isPending) void toggleMut.mutateAsync(detail);
                  }}
                />
              ) : (
                <CrmBadge tone={detail.status === LodatSaleStatus.DANG_BAN ? 'green' : 'gray'}>
                  {detail.status === LodatSaleStatus.DANG_BAN ? 'Mở bán' : 'Tạm dừng'}
                </CrmBadge>
              )}
              <button type="button" className="ld-detail-copy-btn" onClick={() => void handleCopy()}>
                <Copy size={14} aria-hidden />
                Copy thông tin
              </button>
            </div>
          </header>

          {imageCount ? (
            <section className="ld-detail-media" aria-label="Ảnh lô đất">
              <div
                className="ld-detail-hero"
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  setTouchStart({ x: t.clientX, y: t.clientY });
                }}
                onTouchEnd={(e) => {
                  if (!touchStart || imageCount < 2) return;
                  const t = e.changedTouches[0];
                  const dx = t.clientX - touchStart.x;
                  const dy = t.clientY - touchStart.y;
                  setTouchStart(null);
                  if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
                  if (dx < 0) goNext();
                  else goPrev();
                }}
              >
                {imageCount > 1 ? (
                  <>
                    <button
                      type="button"
                      className="ld-detail-hero-nav prev"
                      aria-label="Ảnh trước"
                      onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className="ld-detail-hero-nav next"
                      aria-label="Ảnh sau"
                      onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                ) : null}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={heroUrl}
                  alt=""
                  className="ld-detail-hero-img"
                  onClick={() => setGalleryOpen(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setGalleryOpen(true);
                    }
                  }}
                  aria-label="Mở xem ảnh phóng to"
                />
                {imageCount > 1 ? (
                  <span className="ld-detail-hero-badge" aria-hidden>
                    {heroIdx + 1}/{imageCount}
                  </span>
                ) : null}
              </div>
            </section>
          ) : (
            <div className="ld-detail-no-images">Chưa có ảnh nào</div>
          )}

          <section className="ld-detail-specs" aria-label="Thông tin lô đất">
            <dl className="ld-detail-spec-grid">
              <div>
                <dt>Diện tích</dt>
                <dd>{formatArea(detail.areaM2)}</dd>
              </div>
              <div>
                <dt>Mặt tiền · Hướng</dt>
                <dd>{formatFrontageDir(detail.frontageM, detail.direction)}</dd>
              </div>
              <div>
                <dt>Giá bán</dt>
                <dd className="crm-money">{formatPriceVnd(detail.priceVnd)}</dd>
              </div>
              {detail.priceNote ? (
                <div>
                  <dt>Ghi chú giá</dt>
                  <dd>{detail.priceNote}</dd>
                </div>
              ) : null}
              {detail.brokerFeeNote ? (
                <div>
                  <dt>Hoa hồng</dt>
                  <dd>{detail.brokerFeeNote}</dd>
                </div>
              ) : null}
            </dl>

            {detail.owner ? (
              <footer className="ld-detail-owner">
                <span className="ld-detail-owner-label">Tên chủ đất</span>
                <div className="ld-detail-owner-body">
                  <Link
                    href={`/khach-hang/${detail.owner.customerId}`}
                    className="ld-detail-owner-name"
                  >
                    {detail.owner.fullName}
                  </Link>
                  {detail.owner.phones.length ? (
                    <ul className="ld-detail-owner-phones">
                      {detail.owner.phones.map((ph) => (
                        <li key={ph.phone}>
                          <a href={`tel:${ph.phone}`}>
                            <Phone size={12} aria-hidden />
                            {ph.phone}
                            {ph.label ? ` (${ph.label})` : ''}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </footer>
            ) : null}
          </section>

          {detail.note ? (
            <section className="ld-detail-note" aria-label="Ghi chú">
              <h2>Ghi chú chung (lô đất)</h2>
              <p>{detail.note}</p>
            </section>
          ) : null}

          <div className="ld-detail-desktop-actions">
            <button
              type="button"
              className="ld-detail-action-btn"
              onClick={() => flash('Giao dịch — sẽ làm ở màn giao dịch.')}
            >
              Giao dịch
            </button>
            <button
              type="button"
              className="ld-detail-action-btn secondary"
              onClick={() => flash('Form sửa lô sẽ làm sau.')}
            >
              <SquarePen size={14} aria-hidden />
              Sửa lô đất
            </button>
          </div>
        </div>
      ) : null}

      {detail ? (
        <footer className="ld-detail-mobile-footer">
          <button
            type="button"
            onClick={() => flash('Giao dịch — sẽ làm ở màn giao dịch.')}
          >
            Giao dịch
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => flash('Form sửa lô sẽ làm sau.')}
          >
            Sửa lô đất
          </button>
        </footer>
      ) : null}

      {galleryOpen && imageCount ? (
        <div
          className="ld-gallery-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Thư viện ảnh"
          onClick={() => setGalleryOpen(false)}
        >
          <button
            type="button"
            className="ld-gallery-close"
            aria-label="Đóng"
            onClick={() => setGalleryOpen(false)}
          >
            <X size={22} />
          </button>
          {imageCount > 1 ? (
            <>
              <button
                type="button"
                className="ld-gallery-nav prev"
                aria-label="Ảnh trước"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                className="ld-gallery-nav next"
                aria-label="Ảnh sau"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroUrl}
            alt=""
            className="ld-gallery-img"
            onClick={(e) => e.stopPropagation()}
          />
          {imageCount > 1 ? (
            <span className="ld-gallery-count">
              {heroIdx + 1}/{imageCount}
            </span>
          ) : null}
        </div>
      ) : null}

      <CrmAlertDialog
        open={Boolean(alertMsg)}
        title="Không thực hiện được"
        message={alertMsg ?? ''}
        onClose={() => setAlertMsg(null)}
      />
      <CrmToast message={toast} />
    </div>
  );
}
