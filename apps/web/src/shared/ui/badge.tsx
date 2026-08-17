import type { ReactNode } from 'react';
import './badge.css';

export type BadgeTone = 'green' | 'blue' | 'amber' | 'gray' | 'red';

type Props = {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
};

/** Shared CRM hangtag — UI-GUIDELINES §4.5.4 */
export function CrmBadge({ tone, children, className }: Props) {
  return (
    <span className={['crm-badge', `crm-badge--${tone}`, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
