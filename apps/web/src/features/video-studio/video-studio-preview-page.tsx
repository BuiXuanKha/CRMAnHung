'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { loadVideoProjectMock } from './mock-project-storage';
import { sceneTitle } from './default-scenes';
import './video-studio.css';

export function VideoStudioPreviewPage() {
  const params = useParams<{ id: string }>();
  const lodatId = params.id;
  const project = loadVideoProjectMock(lodatId);
  const scenes = [...project.scenes].sort((a, b) => a.sortOrder - b.sortOrder);

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
          <h1 className="vs-title">Xem trước</h1>
          <p className="vs-subtitle">Mock player 9:16</p>
        </div>
      </header>

      <div
        className="vs-panel"
        style={{
          aspectRatio: '9/16',
          maxHeight: '50dvh',
          margin: '0 auto 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#94a3b8',
        }}
      >
        ▶ Preview (Creatomate — slice sau)
      </div>

      <ul className="vs-scene-list">
        {scenes.map((s) => (
          <li key={s.id} className="vs-scene-card" style={{ cursor: 'default' }}>
            <div className="vs-scene-body">
              <div className="vs-scene-name">{sceneTitle(s)}</div>
              <div className="vs-scene-meta">
                {s.status === 'approved' ? 'Đã duyệt' : 'Chưa duyệt'}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <footer className="vs-footer">
        <Link href={`/lo-dat/${lodatId}/video`} scroll={false} className="vs-btn-secondary">
          Quay lại chỉnh
        </Link>
        <Link href={`/lo-dat/${lodatId}/video/export`} scroll={false} className="vs-btn-primary">
          Xuất video
        </Link>
      </footer>
    </div>
  );
}
