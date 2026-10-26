'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLodat } from '@/features/lodats/api';
import { CrmToast } from '@/shared/ui/dialog';
import {
  POI_PRESETS,
  SCENE_KIND_LABELS,
  newSceneId,
  sceneTitle,
  type VideoSceneDraft,
  type VideoSceneKind,
} from './default-scenes';
import {
  canAddScene,
  loadVideoProjectMock,
  saveVideoProjectMock,
} from './mock-project-storage';
import './video-studio.css';

export function VideoStudioHubPage() {
  const params = useParams<{ id: string }>();
  const lodatId = params.id;
  const router = useRouter();
  const [project, setProject] = useState(() => loadVideoProjectMock(lodatId));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const lodatQ = useQuery({
    queryKey: ['lodat', lodatId],
    queryFn: () => getLodat(lodatId),
  });

  const scenes = useMemo(
    () => [...project.scenes].sort((a, b) => a.sortOrder - b.sortOrder),
    [project.scenes],
  );

  const approvedCount = scenes.filter((s) => s.status === 'approved').length;
  const canExport = approvedCount > 0;

  const persist = useCallback(
    (nextScenes: VideoSceneDraft[]) => {
      const next = saveVideoProjectMock({ ...project, scenes: nextScenes });
      setProject(next);
    },
    [project],
  );

  function addPresetScene(kind: VideoSceneKind) {
    if (!canAddScene(scenes)) {
      setToast('Tối đa 12 cảnh.');
      return;
    }
    const next: VideoSceneDraft = {
      id: newSceneId(),
      kind,
      sortOrder: scenes.length,
      status: 'draft',
      hasRawClip: false,
      narrationText: '',
      customLabel: kind === 'POI_CUSTOM' ? 'Địa điểm' : undefined,
    };
    persist([...scenes, next]);
    setSheetOpen(false);
    setToast(`Đã thêm: ${SCENE_KIND_LABELS[kind]}.`);
  }

  return (
    <div className="vs-page">
      <header className="vs-header">
        <Link
          href={`/lo-dat/${lodatId}`}
          scroll={false}
          className="vs-back"
          aria-label="Quay lại chi tiết lô"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <div className="vs-header-text">
          <h1 className="vs-title">Video AI</h1>
          <p className="vs-subtitle">
            {lodatQ.data?.title ?? (lodatQ.isLoading ? 'Đang tải…' : 'Lô đất')}
          </p>
        </div>
      </header>

      <span className="vs-status-chip">Nháp · {approvedCount}/{scenes.length} cảnh đã duyệt</span>

      <div className="vs-scene-list">
        {scenes.map((scene) => (
          <Link
            key={scene.id}
            href={`/lo-dat/${lodatId}/video/scene/${scene.id}`}
            scroll={false}
            className="vs-scene-card"
          >
            <div
              className={`vs-scene-thumb ${scene.hasRawClip ? 'has-clip' : ''}`}
              aria-hidden
            >
              9:16
            </div>
            <div className="vs-scene-body">
              <div className="vs-scene-name">{sceneTitle(scene)}</div>
              <div className="vs-scene-meta">
                {scene.hasRawClip ? 'Đã có video thô' : 'Chưa có video'}
                {' · '}
                {scene.status === 'approved' ? 'Đã duyệt' : 'Chưa duyệt'}
              </div>
            </div>
            <ChevronRight className="vs-scene-chevron" size={20} aria-hidden />
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="vs-add-scene"
        onClick={() => setSheetOpen(true)}
        disabled={!canAddScene(scenes)}
      >
        + Thêm cảnh
      </button>

      <footer className="vs-footer">
        <Link
          href={`/lo-dat/${lodatId}/video/preview`}
          scroll={false}
          className="vs-btn-secondary"
        >
          Xem trước
        </Link>
        <button
          type="button"
          className="vs-btn-primary"
          disabled={!canExport}
          onClick={() => router.push(`/lo-dat/${lodatId}/video/export`)}
        >
          Xuất video
        </button>
      </footer>

      {sheetOpen ? (
        <>
          <button
            type="button"
            className="vs-sheet-backdrop"
            aria-label="Đóng"
            onClick={() => setSheetOpen(false)}
          />
          <div className="vs-sheet" role="dialog" aria-labelledby="vs-add-title">
            <h2 id="vs-add-title" className="vs-sheet-title">
              Thêm cảnh
            </h2>
            {POI_PRESETS.map((kind) => (
              <button
                key={kind}
                type="button"
                className="vs-sheet-item"
                onClick={() => addPresetScene(kind)}
              >
                {SCENE_KIND_LABELS[kind]}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <CrmToast message={toast} />
    </div>
  );
}
