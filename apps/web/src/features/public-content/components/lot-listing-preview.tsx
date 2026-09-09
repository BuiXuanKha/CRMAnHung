'use client';

import { ExternalLink, ImageOff } from 'lucide-react';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import { listingHref } from '@/features/public/site';
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
};

export function LotListingPreview({ lot }: Props) {
  const price = lot ? lotPriceDisplay(lot) : null;

  return (
    <aside
      className={`pw-preview${lot ? '' : ' is-empty'}`}
      aria-label="Preview Post"
      {...(lot ? {} : { 'aria-hidden': true as const })}
    >
      <header className="pw-preview-head">
        <h2>Preview Post</h2>
      </header>

      {!lot ? (
        <p className="pw-preview-empty">Chọn một lô để xem bài đăng.</p>
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
          {lot.bodyHtml?.trim() ? (
            <div
              className="pw-preview-rich pw-editor-prose"
              dangerouslySetInnerHTML={{ __html: lot.bodyHtml }}
            />
          ) : (
            <p className="pw-preview-excerpt">{lot.excerpt}</p>
          )}
          <div className="pw-preview-actions">
            {lot.slug ? (
              <a
                className="crm-btn"
                href={listingHref(lot.slug)}
                target="_blank"
                rel="noreferrer"
              >
                <Icon icon={ExternalLink} size="sm" /> Xem trên anhungland.com
              </a>
            ) : null}
          </div>
        </div>
      )}
    </aside>
  );
}
