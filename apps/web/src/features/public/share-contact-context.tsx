'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { LotShareContact } from '@crmanhung/shared';

const PublicShareContactContext = createContext<LotShareContact | null>(null);

export function PublicShareContactProvider({
  contact,
  children,
}: {
  contact: LotShareContact | null;
  children: ReactNode;
}) {
  return (
    <PublicShareContactContext.Provider value={contact}>{children}</PublicShareContactContext.Provider>
  );
}

export function useShareContactFromCookie(): LotShareContact | null {
  return useContext(PublicShareContactContext);
}
