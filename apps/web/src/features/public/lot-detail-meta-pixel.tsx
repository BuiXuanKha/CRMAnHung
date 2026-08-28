'use client';

import { useEffect } from 'react';
import { trackListingViewContent } from './meta-pixel-events';

type Props = {
  slug: string;
  title: string;
  kindLabel?: string | null;
};

/** ViewContent with listing data from SSR (not mock catalog). */
export function LotDetailMetaPixel({ slug, title, kindLabel }: Props) {
  useEffect(() => {
    trackListingViewContent({ slug, title, kindLabel });
  }, [slug, title, kindLabel]);

  return null;
}
