import type { ReactNode } from 'react';
import { AppShell } from '@/shared/ui/layout';

export default function CrmLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
