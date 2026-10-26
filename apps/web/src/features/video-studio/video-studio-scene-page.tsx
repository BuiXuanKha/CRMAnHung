'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { getLodat } from '@/features/lodats/api';
import { CrmToast } from '@/shared/ui/dialog';
import { sceneTitle } from './default-scenes';
import { loadVideoProjectMock, saveVideoProjectMock } from './mock-project-storage';
import './video-studio.css';

export function VideoStudioScenePage() {
  const params = useParams<{ id: string; sceneId: string }>();
  const { id: lodatId, sceneId } = params;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState(() => loadVideoProjectMock(lodatId));
  const [toast, setToast] = useState<string | null>(null);

  useQuery({
    queryKey: ['lodat', lodatId],
    queryFn: () => getLodat(lodatId),
  });

  const scene = project.scenes.find((s) => s.id === sceneId);

  const persistScene = useCallback(
    (patch: Partial<NonNullable<typeof scene>>) => {
      if (!scene) return;
      const scenes = project.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...patch } : s,
      );
      const next = saveVideoProjectMock({ ...project, scenes });
      setProject(next);
    },
    [project, scene, sceneId],
  );

  if (!scene) {
    return (
      <div className="vs-page">
        <p className="vs-hint">Không tìm thấy cảnh.</p>
        <Link href={`/lo-dat/${lodatId}/video`} scroll={false} className="vs-back">
          Quay lại
        </Link>
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
          aria-label="Quay lại danh sách cảnh"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <div className="vs-header-text">
          <h1 className="vs-title">{sceneTitle(scene)}</h1>
          <p className="vs-subtitle">Chỉnh cảnh · mock UI</p>
        </div>
      </header>

      <section className="vs-panel">
        <span className="vs-label">Video thô</span>
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          capture="environment"
          hidden
          onChange={() => {
            persistScene({ hasRawClip: true });
            setToast('Đã gắn video thô (mock).');
          }}
        />
        {scene.hasRawClip ? (
          <>
            <p className="vs-hint">Đã chọn file (chưa upload server — slice sau).</p>
            <button
              type="button"
              className="vs-btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => fileRef.current?.click()}
            >
              Thay video
            </button>
          </>
        ) : (
          <button
            type="button"
            className="vs-upload-zone"
            onClick={() => fileRef.current?.click()}
          >
            <strong>Chọn video</strong>
            <span className="vs-hint">Tỷ lệ 9:16 khuyến nghị</span>
          </button>
        )}
      </section>

      <section className="vs-panel">
        <span className="vs-label">Phân tích AI</span>
        <p className="vs-hint">
          OpenAI + chọn đoạn đẹp sẽ nối ở slice API. Hiện chỉ nhập / sửa lời thủ công.
        </p>
      </section>

      <section className="vs-panel">
        <label className="vs-label" htmlFor="vs-narration">
          Lời thuyết minh
        </label>
        <textarea
          id="vs-narration"
          className="vs-textarea"
          value={scene.narrationText}
          placeholder="Lời đọc ElevenLabs…"
          onChange={(e) => persistScene({ narrationText: e.target.value })}
        />
        <button
          type="button"
          className="vs-btn-secondary"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => setToast('Tạo lại từ AI — sắp có.')}
        >
          Tạo lại từ AI
        </button>
      </section>

      <footer className="vs-footer">
        <button
          type="button"
          className="vs-btn-primary"
          onClick={() => {
            persistScene({ status: 'approved' });
            setToast('Đã duyệt cảnh.');
            router.push(`/lo-dat/${lodatId}/video`);
          }}
        >
          Duyệt cảnh
        </button>
      </footer>

      <CrmToast message={toast} />
    </div>
  );
}
