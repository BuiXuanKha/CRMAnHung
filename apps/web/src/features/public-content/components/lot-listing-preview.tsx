'use client';

import { ExternalLink, Globe, ImageOff } from 'lucide-react';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import { ANHUNG_BRAND } from '@/features/public/brand';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';
import {
  lotKindLabel,
  lotPriceDisplay,
  lotSpecLine,
  lotWebLabel,
  lotWebTone,
} from '../display';

type Props = {
  lot: PublicWebStaffLotRow | null;
  busy: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
};

export function LotListingPreview({ lot, busy, onPublish, onUnpublish }: Props) {
  const price = lot ? lotPriceDisplay(lot) : null;

  return (
    <aside className="pw-preview" aria-label="Preview bài đăng">
      <header className="pw-preview-head">
        <p className="pw-preview-kicker">Preview trang khách</p>
        <h2>Bài đăng lô đất</h2>
      </header>

      {!lot ? (
        <p className="pw-preview-empty">Chọn một lô đang mở bán để xem bài đăng.</p>
      ) : (
        <div className="pw-preview-body">
          <span className="pw-preview-cover">
            {lot.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lot.coverImageUrl} alt="" />
            ) : (
              <span className="pw-thumb-empty">
                <Icon icon={ImageOff} />
              </span>
            )}
          </span>
          <CrmBadge tone={lotWebTone(lot.isPublished)}>{lotWebLabel(lot.isPublished)}</CrmBadge>
          <h3 className="pw-preview-title">{lot.title}</h3>
          <p className="pw-sub">{lot.location || '—'}</p>
          {price?.isMoney ? (
            <p className="crm-money pw-preview-price">{price.text}</p>
          ) : (
            <p className="pw-contact pw-preview-price">{price?.text}</p>
          )}
          <p className="pw-preview-specs">
            <CrmBadge tone="amber">{lotKindLabel(lot)}</CrmBadge>
            <span>{lotSpecLine(lot)}</span>
          </p>
          <p className="pw-preview-excerpt">{lot.excerpt}</p>
          <p className="pw-preview-contact">
            Hotline {ANHUNG_BRAND.hotlineDisplay} · Zalo {ANHUNG_BRAND.hotlineAltDisplay}
          </p>
          <p className="crm-form-hint">Không hiện tên khách, SĐT khách, NV hay hoa hồng.</p>
          <div className="pw-preview-actions">
            {lot.isPublished ? (
              <>
                <a
                  className="crm-btn"
                  href={`/san-pham/${lot.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon icon={ExternalLink} size="sm" /> Xem trên anhungland.com
                </a>
                <button
                  type="button"
                  className="crm-btn danger"
                  disabled={busy}
                  onClick={onUnpublish}
                >
                  Gỡ web
                </button>
              </>
            ) : (
              <button
                type="button"
                className="crm-btn primary"
                disabled={busy}
                onClick={onPublish}
              >
                <Icon icon={Globe} size="sm" /> Đăng web
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
