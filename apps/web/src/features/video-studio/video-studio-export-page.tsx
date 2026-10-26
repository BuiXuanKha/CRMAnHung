'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { CrmToast } from '@/shared/ui/dialog';
import { exportVideoProject, getVideoProjectForLodat } from './api';
import './video-studio.css';

const projectKey = (lodatId: string) => ['videoProject', lodatId] as const;

export function VideoStudioExportPage() {
  const params = useParams<{ id: string }>();
  const lodatId = params.id;
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const started = useRef(false);

  const projectQ = useQuery({
    queryKey: projectKey(lodatId),
    queryFn: () => getVideoProjectForLodat(lodatId),
    refetchInterval: (q) =>
      q.state.data?.status === 'PROCESSING' ? 4000 : false,
  });

  const exportMut = useMutation({
    mutationFn: () => exportVideoProject(projectQ.data!.id),
    onSuccess: (data) => {
      qc.setQueryData(projectKey(lodatId), data);
      if (data.status === 'COMPLETED') {
        setToast('Xuất video xong.');
      }
    },
    onError: (e: Error) => {
      setToast(e.message);
      void projectQ.refetch();
    },
  });

  const project = projectQ.data;
  const processing =
    project?.status === 'PROCESSING' || exportMut.isPending;
  const done = project?.status === 'COMPLETED' && project.exportDownloadUrl;

  useEffect(() => {
    if (!project || started.current) return;
    if (project.status === 'COMPLETED' || project.status === 'PROCESSING') {
      return;
    }
    started.current = true;
    exportMut.mutate();
  }, [project, exportMut]);

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
          <p className="vs-subtitle">GPT · ElevenLabs · Creatomate</p>
        </div>
      </header>

      <section className="vs-panel">
        {processing ? (
          <>
            <p className="vs-hint">
              Đang xử lý: TTS từng cảnh → Creatomate render → lưu MP4 (có thể vài phút).
            </p>
            <p className="vs-hint" style={{ marginTop: 8 }}>
              Vui lòng giữ màn hình mở…
            </p>
          </>
        ) : done ? (
          <>
            <p className="vs-hint">File sẵn sàng tải (9:16, giọng AI).</p>
            <a
              href={project.exportDownloadUrl!}
              className="vs-btn-primary"
              style={{ display: 'block', textAlign: 'center', marginTop: 12 }}
              download
            >
              Tải MP4
            </a>
            <Link
              href={`/lo-dat/${lodatId}`}
              scroll={false}
              className="vs-btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
            >
              Quay về lô
            </Link>
          </>
        ) : project?.status === 'FAILED' ? (
          <>
            <p className="vs-hint" style={{ color: 'var(--crm-danger, #c00)' }}>
              {project.exportError ?? 'Xuất video thất bại.'}
            </p>
            <button
              type="button"
              className="vs-btn-primary"
              style={{ width: '100%', marginTop: 12 }}
              onClick={() => {
                started.current = true;
                exportMut.mutate();
              }}
            >
              Thử xuất lại
            </button>
          </>
        ) : (
          <button
            type="button"
            className="vs-btn-primary"
            style={{ width: '100%' }}
            onClick={() => exportMut.mutate()}
          >
            Bắt đầu xuất
          </button>
        )}
      </section>

      <CrmToast message={toast} />
    </div>
  );
}
