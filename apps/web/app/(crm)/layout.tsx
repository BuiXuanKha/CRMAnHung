import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/shared/ui/layout';

/** CRM nội bộ — không index công cụ tìm kiếm. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function CrmLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
