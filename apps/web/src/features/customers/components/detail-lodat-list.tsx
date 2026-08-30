'use client';

import type { CustomerLodatBrief } from '@crmanhung/shared';
import { CustomerLodatCards } from './customer-lodat-cards';

type Props = {
  lots: CustomerLodatBrief[];
  loading?: boolean;
};

export function DetailLodatList({ lots, loading }: Props) {
  return (
    <CustomerLodatCards
      lots={lots}
      loading={loading}
      emptyClassName="kh-detail-empty"
    />
  );
}
