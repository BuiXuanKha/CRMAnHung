'use client';

import type { CustomerDetail, CustomerListItem } from '@crmanhung/shared';
import { mockChats, mockLodatsByCustomer } from '../mock-data';

export type RailKey = 'chat' | 'care' | 'lodat';

const TABS: { key: RailKey; label: string }[] = [
  { key: 'chat', label: 'Nội dung chat' },
  { key: 'care', label: 'Lịch sử chăm sóc' },
  { key: 'lodat', label: 'Danh sách lô đất' },
];

type Props = {
  open: RailKey | null;
  onToggle: (key: RailKey) => void;
  customer: CustomerListItem | null;
  detail: CustomerDetail | null;
};

export function RightRail({ open, onToggle, customer, detail }: Props) {
  return (
    <aside className="kh-rail" aria-label="Panel phụ">
      {open ? (
        <div className="kh-rail-panel">
          <header>
            <strong>{TABS.find((t) => t.key === open)?.label}</strong>
            <button type="button" onClick={() => onToggle(open)} aria-label="Thu hẹp">
              ›
            </button>
          </header>
          <div className="kh-rail-body">{renderBody(open, customer, detail)}</div>
        </div>
      ) : null}
      <div className="kh-rail-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={open === tab.key ? 'active' : undefined}
            onClick={() => onToggle(tab.key)}
            title={tab.label}
          >
            <span className="chev" aria-hidden>
              ‹
            </span>
            <span className="lbl">{tab.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function renderBody(open: RailKey, customer: CustomerListItem | null, detail: CustomerDetail | null) {
  if (!customer) {
    return <p className="kh-rail-empty">Chọn một khách trên bảng để xem.</p>;
  }
  if (open === 'chat') {
    const msgs = mockChats[customer.id] ?? [];
    if (msgs.length === 0) {
      return <p className="kh-rail-empty">Chưa có nội dung chat (mock).</p>;
    }
    return (
      <ul className="kh-chat">
        {msgs.map((m) => (
          <li key={m.id} className={m.from}>
            <span>{m.text}</span>
          </li>
        ))}
      </ul>
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
          <li key={n.id}>
            <strong>{n.employeeName}</strong>
            <p>{n.note}</p>
            <time>{new Date(n.createdAt).toLocaleString('vi-VN')}</time>
          </li>
        ))}
      </ul>
    );
  }
  const lots = mockLodatsByCustomer[customer.id] ?? [];
  if (lots.length === 0) {
    return <p className="kh-rail-empty">Chưa gắn lô đất.</p>;
  }
  return (
    <ul className="kh-lots">
      {lots.map((l) => (
        <li key={l.id}>
          <strong>{l.title}</strong>
          <span>
            {l.area} · {l.price}
          </span>
        </li>
      ))}
    </ul>
  );
}
