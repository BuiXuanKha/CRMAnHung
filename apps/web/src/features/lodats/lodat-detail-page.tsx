'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Copy, Phone, Share2, SquarePen } from 'lucide-react';
import {
  LodatSaleStatus,
  UserRole,
  guestLotShareUrl,
  type LodatDetail,
  type LodatListingStatus,
} from '@crmanhung/shared';
import { useAuth } from '@/features/auth/auth-context';
import { CrmBadge } from '@/shared/ui/badge';
import { CrmAlertDialog, CrmToast } from '@/shared/ui/dialog';
import { getLodat, listSameWardLodats, updateLodatImageRotation, updateLodatSaleStatus } from './api';
import { createLodatShareLink } from '@/features/lot-shares/api';
import { LodatImageGallery } from './components/lodat-image-gallery';
import { LodatOwnerFab } from './components/lodat-owner-fab';
import { LodatTransactionHistory } from './components/lodat-transaction-history';
import { SameWardList } from './components/same-ward-list';
import { SaleToggle } from './components/sale-toggle';
import { buildLodatCopyText, buildLodatShareClipboard, copyTextToClipboard } from './copy-text';
import { createTransactionHref } from './transaction-href';
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
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === UserRole.ADMIN;

  const [heroIdx, setHeroIdx] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const q = useQuery({
    queryKey: ['lodat', id],
    queryFn: () => getLodat(id),
    enabled: Boolean(id),
  });

  const sameWardQ = useQuery({
    queryKey: ['lodat', id, 'same-ward'],
    queryFn: () => listSameWardLodats(id),
    enabled: Boolean(id) && Boolean(q.data),
  });

  const detail = q.data ?? null;
  const galleryImages =
    detail?.images?.length
      ? detail.images
      : detail?.imageUrls?.length
        ? detail.imageUrls.map((url) => ({
            id: null,
            url,
            rotationDeg: 0,
            source: 'lodat' as const,
          }))
        : detail?.coverImageUrl
          ? [
              {
                id: null,
                url: detail.coverImageUrl,
                rotationDeg: 0,
                source: 'lodat' as const,
              },
            ]
          : [];
  const imageCount = galleryImages.length;

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

  function goTransaction() {
    if (!detail) return;
    if (isAdmin) {
      setAlertMsg('Admin không tạo giao dịch. Nhân viên tạo giao dịch từ lô của mình.');
      return;
    }
    router.push(createTransactionHref(detail.id));
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

  async function handleShare() {
    if (!detail || shareBusy) return;
    setShareBusy(true);
    try {
      const res = await createLodatShareLink(detail.id);
      await copyTextToClipboard(
        buildLodatShareClipboard(detail, guestLotShareUrl(res.slug, res.shareCode)),
      );
      flash('Đã copy nội dung + link share.');
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : 'Không tạo được link share.');
    } finally {
      setShareBusy(false);
    }
  }

  const hero = galleryImages[heroIdx] ?? galleryImages[0] ?? null;
  const heroUrl = hero?.url ?? '';
  const heroRotation = hero?.rotationDeg ?? 0;

  const sameWardName = sameWardQ.data?.wardName ?? detail?.wardName ?? null;
  const sameWardItems = sameWardQ.data?.items ?? [];
  const sameWardError =
    sameWardQ.error instanceof Error ? sameWardQ.error.message : null;
  /** Ẩn khi không có xã (CRM cũ: wardId không hợp lệ → null). */
  const sameWardVisible = Boolean(
    sameWardName || sameWardItems.length || sameWardError,
  );
  const owner = detail?.owner ?? null;

  return (
    <div
      className={[
        'ld-detail-page',
        detail ? 'has-owner-fab' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Link href="/lo-dat" scroll={false} className="ld-detail-back">
        ← Danh sách lô đất
      </Link>

      {q.isLoading ? <p className="ld-detail-state">Đang tải…</p> : null}
      {q.error ? <p className="ld-detail-error">{(q.error as Error).message}</p> : null}

      {detail ? (
        <div className="ld-detail-layout">
          <div className="ld-detail-content">
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
                  <CrmBadge
                    tone={detail.status === LodatSaleStatus.DANG_BAN ? 'green' : 'gray'}
                  >
                    {detail.status === LodatSaleStatus.DANG_BAN ? 'Mở bán' : 'Tạm dừng'}
                  </CrmBadge>
                )}
                <button
                  type="button"
                  className="ld-detail-copy-btn"
                  onClick={() => void handleCopy()}
                >
                  <Copy size={14} aria-hidden />
                  Copy thông tin
                </button>
                <button
                  type="button"
                  className="ld-detail-copy-btn"
                  disabled={shareBusy}
                  onClick={() => void handleShare()}
                >
                  <Share2 size={14} aria-hidden />
                  {shareBusy ? 'Đang tạo…' : 'Chia sẻ'}
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
                    style={
                      heroRotation
                        ? { transform: `rotate(${heroRotation}deg)` }
                        : undefined
                    }
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

            <LodatTransactionHistory items={detail.transactionHistory} />

            <SameWardList
              placement="mobile"
              visible={sameWardVisible}
              wardName={sameWardName}
              items={sameWardItems}
              loading={sameWardQ.isLoading}
              error={sameWardError}
            />

            <div className="ld-detail-desktop-actions">
              <button
                type="button"
                className="ld-detail-action-btn"
                onClick={goTransaction}
              >
                Giao dịch
              </button>
              <button
                type="button"
                className="ld-detail-action-btn secondary"
                onClick={() => router.push(`/lo-dat/${detail.id}/sua`)}
              >
                <SquarePen size={14} aria-hidden />
                Sửa lô đất
              </button>
            </div>
          </div>

          <SameWardList
            placement="desktop"
            visible={sameWardVisible}
            wardName={sameWardName}
            items={sameWardItems}
            loading={sameWardQ.isLoading}
            error={sameWardError}
          />
        </div>
      ) : null}

      {detail ? (
        <footer className="ld-detail-mobile-footer" aria-hidden="true" />
      ) : null}

      {detail ? (
        <LodatOwnerFab
          owner={owner}
          onTransaction={goTransaction}
          onEdit={() => router.push(`/lo-dat/${detail.id}/sua`)}
        />
      ) : null}

      {galleryOpen && detail && imageCount ? (
        <LodatImageGallery
          title={detail.title}
          images={galleryImages}
          startIndex={heroIdx}
          onClose={() => setGalleryOpen(false)}
          onIndexChange={setHeroIdx}
          onRotate={async (image, nextDeg) => {
            if (!image.id) {
              throw new Error('Ảnh dự án chung không lưu xoay tại đây.');
            }
            const updated = await updateLodatImageRotation(detail.id, image.id, {
              rotationDeg: nextDeg,
            });
            await qc.invalidateQueries({ queryKey: ['lodat', id] });
            const saved = updated.images.find((i) => i.id === image.id);
            return saved?.rotationDeg ?? nextDeg;
          }}
          onToast={flash}
          onError={setAlertMsg}
        />
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
