'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { CrmToast } from '@/shared/ui/dialog';
import './video-studio.css';

export function VideoStudioExportPage() {
  const params = useParams<{ id: string }>();
  const lodatId = params.id;
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  return (
    <div className="vs-page">
      <header className="vs-header">
        <Link
          href={`/lo-dat/${lodatId}/video`}
          scroll={false}
          className="vs-back"
          aria-label="Quay lại"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <div className="vs-header-text">
          <h1 className="vs-title">Xuất video</h1>
          <p className="vs-subtitle">MP4 · 9:16 · giọng AI</p>
        </div>
      </header>

      <section className="vs-panel">
        {!done ? (
          <>
            <p className="vs-hint">Đang mô phỏng render (Creatomate + ElevenLabs — chưa nối API).</p>
            <button
              type="button"
              className="vs-btn-primary"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => {
                setDone(true);
                setToast('Mock: render xong.');
              }}
            >
              Bắt đầu xuất (mock)
            </button>
          </>
        ) : (
          <>
            <p className="vs-hint">File sẵn sàng tải (mock).</p>
            <button
              type="button"
              className="vs-btn-primary"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => setToast('Tải MP4 — sắp có khi nối R2.')}
            >
              Tải MP4
            </button>
            <Link
              href={`/lo-dat/${lodatId}`}
              scroll={false}
              className="vs-btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
            >
              Quay về lô
            </Link>
          </>
        )}
      </section>

      <CrmToast message={toast} />
    </div>
  );
}
