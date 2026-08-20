'use client';

import { useMemo, useState } from 'react';
import {
  CUSTOMER_MESSAGE_SENDER_LABELS,
  type CustomerMessengerMessage,
} from '@crmanhung/shared';
import { ChatImageGallery } from './chat-gallery';

type Props = {
  customerName: string;
  messages: CustomerMessengerMessage[];
  loading: boolean;
};

function messageText(msg: CustomerMessengerMessage): string {
  const body = msg.body?.trim() ?? '';
  if (body) return body;
  if (msg.images.length) return '[Ảnh]';
  return '—';
}

export function ChatThread({ customerName, messages, loading }: Props) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const gallery = useMemo(() => {
    const urls: string[] = [];
    const rotations: number[] = [];
    const indexById = new Map<string, number>();
    for (const msg of messages) {
      for (const img of msg.images) {
        indexById.set(img.id, urls.length);
        urls.push(img.url);
        rotations.push(img.rotationDeg ?? 0);
      }
    }
    return { urls, rotations, indexById };
  }, [messages]);

  if (loading) {
    return <p className="kh-rail-empty">Đang tải tin nhắn…</p>;
  }
  if (messages.length === 0) {
    return <p className="kh-rail-empty">Không có tin nhắn trong bản quét này.</p>;
  }

  return (
    <>
      <ul className="kh-chat">
        {messages.map((msg, index) => (
          <li key={msg.id} className={msg.sender}>
            <div className="kh-chat-meta">
              #{index + 1} · {CUSTOMER_MESSAGE_SENDER_LABELS[msg.sender]}
            </div>
            <div>{messageText(msg)}</div>
            {msg.images.length ? (
              <div className="kh-chat-imgs">
                {msg.images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setGalleryIndex(gallery.indexById.get(img.id) ?? 0)}
                    aria-label="Xem ảnh chat"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt=""
                      loading="lazy"
                      style={
                        img.rotationDeg
                          ? { transform: `rotate(${img.rotationDeg}deg)` }
                          : undefined
                      }
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {galleryIndex != null ? (
        <ChatImageGallery
          title={customerName ? `Ảnh chat — ${customerName}` : 'Ảnh chat'}
          urls={gallery.urls}
          rotations={gallery.rotations}
          startIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      ) : null}
    </>
  );
}
