'use client';

import { useEffect, useState } from 'react';
import {
  contactFromAuthUser,
  type AuthUser,
  type LotShareContact,
} from '@crmanhung/shared';
import { peekSessionUser, useAuth } from '@/features/auth/auth-context';
import { resolvedPublicContact } from './public-contact';
import { useShareContactFromCookie } from './share-contact-context';

/** NV đã login (có SĐT) thắng cookie/?share=; khách không login giữ share hoặc hotline công ty. */
export function usePublicContact(shareContact?: LotShareContact | null) {
  const { user, loading } = useAuth();
  const fromCookie = useShareContactFromCookie();
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setSessionUser(peekSessionUser());
  }, [user, loading]);

  const staff = contactFromAuthUser(user) ?? contactFromAuthUser(sessionUser);
  return resolvedPublicContact(staff ?? shareContact ?? fromCookie ?? null);
}
