'use client';

import { useEffect, useRef } from 'react';
import { recordPublicLotShareVisit } from '@/features/lot-shares/api';

/** Ghi nhận lượt xem qua link share (một lần / mount). */
export function LotShareVisitTracker({ shareCode }: { shareCode: string }) {
  const sent = useRef(false);

  useEffect(() => {
    const code = shareCode.trim();
    if (!code || sent.current) return;
    sent.current = true;
    void recordPublicLotShareVisit(code);
  }, [shareCode]);

  return null;
}
