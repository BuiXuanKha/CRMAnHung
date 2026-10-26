'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getLodat } from '@/features/lodats/api';
import { CrmToast } from '@/shared/ui/dialog';
import { addVideoScene, getVideoProjectForLodat } from './api';
import { routeParamId } from './route-params';
import { POI_PRESETS, SCENE_KIND_LABELS, sceneTitle, type VideoSceneKind } from './default-scenes';
import './video-studio.css';

const projectKey = (lodatId: string) => ['videoProject', lodatId] as const;

export function VideoStudioHubPage() {
  const params = useParams<{ id: string }>();
  const lodatId = routeParamId(params.id);
  const router = useRouter();
  const qc = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const lodatQ = useQuery({
    queryKey: ['lodat', lodatId],
    queryFn: () => getLodat(lodatId),
  });

  const projectQ = useQuery({
    queryKey: projectKey(lodatId),
    queryFn: () => getVideoProjectForLodat(lodatId),
    enabled: Boolean(lodatId),
  });

  const addMut = useMutation({
    mutationFn: (kind: VideoSceneKind) =>
      addVideoScene(projectQ.data!.id, { kind }),
    onSuccess: (data) => {
      qc.setQueryData(projectKey(lodatId), data);
      setSheetOpen(false);
      setToast('Đã thêm cảnh.');
    },
    onError: (e: Error) => setToast(e.message),
  });

  const project = projectQ.data;
  const scenes = project?.scenes ?? [];
  const approvedCount = scenes.filter((s) => s.status === 'approved').length;
  const canExport = approvedCount > 0 && project?.status !== 'PROCESSING';

  const statusLabel =
    project?.status === 'PROCESSING'
      ? 'Đang xử lý'
      : project?.status === 'COMPLETED'
        ? 'Hoàn thành'
        : project?.status === 'FAILED'
          ? 'Lỗi xuất'
          : 'Nháp';

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

      {projectQ.isLoading ? (
        <p className="vs-hint">Đang tải dự án video…</p>
      ) : projectQ.isError ? (
        <p className="vs-hint">Không tải được dự án video.</p>
      ) : (
        <>
          <span className="vs-status-chip">
            {statusLabel} · {approvedCount}/{scenes.length} cảnh đã duyệt
          </span>
          {project?.exportError ? (
            <p className="vs-hint" style={{ color: 'var(--crm-danger, #c00)' }}>
              {project.exportError}
            </p>
          ) : null}

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
            disabled={scenes.length >= 12}
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
        </>
      )}

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
                disabled={addMut.isPending}
                onClick={() => addMut.mutate(kind)}
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
