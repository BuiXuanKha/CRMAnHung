import type { ReactNode } from 'react';

/** Layout trang public (landing / marketing) — tách khỏi CRM shell. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="public-shell">{children}</div>;
}
