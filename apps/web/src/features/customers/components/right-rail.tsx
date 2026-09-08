'use client';

import { ChevronLeft } from 'lucide-react';
import type {
  CustomerDetail,
  CustomerListItem,
  CustomerLodatBrief,
  CustomerMessengerMessage,
} from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { CrmBadge } from '@/shared/ui/badge';
import { ChatThread } from './chat-thread';
import { CustomerLodatCards } from './customer-lodat-cards';

export type RailKey = 'chat' | 'care' | 'lodat';

const TABS: { key: RailKey; label: string }[] = [
  { key: 'chat', label: 'Nội dung chat' },
  { key: 'care', label: 'Lịch sử chăm sóc' },
  { key: 'lodat', label: 'Danh sách lô đất' },
];

export function visibleRailTabs(customer: CustomerListItem | null): RailKey[] {
  if (!customer) return [];
  const tabs: RailKey[] = [];
  if ((customer.messageCount ?? 0) > 0) tabs.push('chat');
  if ((customer.careNoteCount ?? 0) > 0) tabs.push('care');
  if ((customer.lodatCount ?? 0) > 0) tabs.push('lodat');
  return tabs;
}

type Props = {
  open: RailKey | null;
  onToggle: (key: RailKey) => void;
  customer: CustomerListItem | null;
  detail: CustomerDetail | null;
  messages: CustomerMessengerMessage[];
  messagesLoading: boolean;
  lodats: CustomerLodatBrief[];
  lodatsLoading: boolean;
};

export function RightRail({
  open,
  onToggle,
  customer,
  detail,
  messages,
  messagesLoading,
  lodats,
  lodatsLoading,
}: Props) {
  const tabs = TABS.filter((tab) => visibleRailTabs(customer).includes(tab.key));
  if (tabs.length === 0 && !open) return null;

  return (
    <aside className="kh-s322" aria-label="Panel phụ">
      {open ? (
        <div className="kh-rail-panel">
          <header>
            <strong>{TABS.find((t) => t.key === open)?.label}</strong>
            <button type="button" onClick={() => onToggle(open)} aria-label="Thu hẹp">
              Thu hẹp
            </button>
          </header>
          <div className="kh-rail-body">
            {renderBody(
              open,
              customer,
              detail,
              messages,
              messagesLoading,
              lodats,
              lodatsLoading,
            )}
          </div>
        </div>
      ) : null}
      {tabs.length > 0 ? (
        <div className="kh-rail-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={open === tab.key ? 'active' : undefined}
              onClick={() => onToggle(tab.key)}
              title={tab.label}
            >
              <span className="chev" aria-hidden>
                <Icon icon={ChevronLeft} size="sm" />
              </span>
              <span className="lbl">{tab.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function renderBody(
  open: RailKey,
  customer: CustomerListItem | null,
  detail: CustomerDetail | null,
  messages: CustomerMessengerMessage[],
  messagesLoading: boolean,
  lodats: CustomerLodatBrief[],
  lodatsLoading: boolean,
) {
  if (!customer) {
    return <p className="kh-rail-empty">Chọn một khách trên bảng để xem.</p>;
  }
  if (open === 'chat') {
    return (
      <ChatThread
        customerName={customer.fullName}
        messages={messages}
        loading={messagesLoading}
      />
    );
  }
  if (open === 'care') {
    const notes = detail?.careNotes ?? [];
    if (notes.length === 0) {
      return <p className="kh-rail-empty">Chưa có lịch sử chăm sóc.</p>;
    }
    return (
      <ul className="kh-care">
        {notes.map((n) => (
          <li key={n.id} className={n.completedAt ? 'is-done' : undefined}>
            <strong>
              {n.employeeName}
              {n.completedAt ? <CrmBadge tone="green">Đã hoàn thành</CrmBadge> : null}
            </strong>
            {n.needSummary?.trim() ? <p>{n.needSummary}</p> : null}
            {n.note.trim() ? <p className="kh-care-note">{n.note}</p> : null}
            <time>{new Date(n.createdAt).toLocaleString('vi-VN')}</time>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <CustomerLodatCards
      lots={lodats}
      loading={lodatsLoading}
      emptyClassName="kh-rail-empty"
    />
  );
}
