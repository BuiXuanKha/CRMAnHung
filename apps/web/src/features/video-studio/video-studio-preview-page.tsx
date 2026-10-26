'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { getVideoProjectForLodat } from './api';
import { sceneTitle } from './default-scenes';
import { routeParamId } from './route-params';
import './video-studio.css';

export function VideoStudioPreviewPage() {
  const params = useParams<{ id: string }>();
  const lodatId = routeParamId(params.id);

  const projectQ = useQuery({
    queryKey: ['videoProject', lodatId],
    queryFn: () => getVideoProjectForLodat(lodatId),
    enabled: Boolean(lodatId),
  });

  const approved = (projectQ.data?.scenes ?? [])
    .filter((s) => s.status === 'approved')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!lodatId) {
    return (
      <div className="vs-page">
        <p className="vs-hint">Không xác định được lô đất.</p>
      </div>
    );
  }

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
          <p className="vs-subtitle">{approved.length} cảnh đã duyệt</p>
        </div>
      </header>

      <div className="vs-preview-frame" aria-hidden>
        ▶ Preview sau khi xuất MP4
      </div>

      <ul className="vs-scene-list" style={{ marginTop: 16 }}>
        {approved.map((scene) => (
          <li key={scene.id} className="vs-scene-card" style={{ listStyle: 'none' }}>
            <div className="vs-scene-body">
              <div className="vs-scene-name">{sceneTitle(scene)}</div>
              <div className="vs-scene-meta">
                {(scene.narrationText ?? '').slice(0, 80)}
                {(scene.narrationText ?? '').length > 80 ? '…' : ''}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <footer className="vs-footer">
        <Link
          href={`/lo-dat/${lodatId}/video`}
          scroll={false}
          className="vs-btn-secondary"
        >
          Quay lại chỉnh
        </Link>
        <Link
          href={`/lo-dat/${lodatId}/video/export`}
          scroll={false}
          className="vs-btn-primary"
        >
          Xuất video
        </Link>
      </footer>
    </div>
  );
}
