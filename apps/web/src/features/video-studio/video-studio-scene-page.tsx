'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { CrmToast } from '@/shared/ui/dialog';
import {
  generateSceneNarration,
  getVideoProjectForLodat,
  updateVideoScene,
  uploadSceneRawVideo,
} from './api';
import { sceneTitle } from './default-scenes';
import './video-studio.css';

const projectKey = (lodatId: string) => ['videoProject', lodatId] as const;

export function VideoStudioScenePage() {
  const params = useParams<{ id: string; sceneId: string }>();
  const { id: lodatId, sceneId } = params;
  const router = useRouter();
  const qc = useQueryClient();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [narrationLocal, setNarrationLocal] = useState<string | null>(null);

  const projectQ = useQuery({
    queryKey: projectKey(lodatId),
    queryFn: () => getVideoProjectForLodat(lodatId),
  });

  const project = projectQ.data;
  const scene = project?.scenes.find((s) => s.id === sceneId);
  const narration =
    narrationLocal ?? scene?.narrationText ?? '';

  const uploadMut = useMutation({
    mutationFn: (file: File) =>
      uploadSceneRawVideo(project!.id, sceneId, file),
    onSuccess: (data) => {
      qc.setQueryData(projectKey(lodatId), data);
      setToast('Đã upload video thô.');
    },
    onError: (e: Error) => setToast(e.message),
  });

  const saveNarrMut = useMutation({
    mutationFn: (text: string) =>
      updateVideoScene(project!.id, sceneId, { narrationText: text }),
    onSuccess: (data) => {
      qc.setQueryData(projectKey(lodatId), data);
      setNarrationLocal(null);
    },
    onError: (e: Error) => setToast(e.message),
  });

  const gptMut = useMutation({
    mutationFn: () => generateSceneNarration(project!.id, sceneId),
    onSuccess: (data) => {
      qc.setQueryData(projectKey(lodatId), data);
      setNarrationLocal(null);
      setToast('Đã tạo lời thuyết minh bằng GPT.');
    },
    onError: (e: Error) => setToast(e.message),
  });

  const approveMut = useMutation({
    mutationFn: () =>
      updateVideoScene(project!.id, sceneId, { status: 'approved' }),
    onSuccess: (data) => {
      qc.setQueryData(projectKey(lodatId), data);
      setToast('Đã duyệt cảnh.');
      router.push(`/lo-dat/${lodatId}/video`);
    },
    onError: (e: Error) => setToast(e.message),
  });

  if (projectQ.isLoading) {
    return (
      <div className="vs-page">
        <p className="vs-hint">Đang tải…</p>
      </div>
    );
  }

  if (!scene || !project) {
    return (
      <div className="vs-page">
        <p className="vs-hint">Không tìm thấy cảnh.</p>
        <Link href={`/lo-dat/${lodatId}/video`} scroll={false} className="vs-back">
          Quay lại
        </Link>
      </div>
    );
  }

  const busy =
    uploadMut.isPending || gptMut.isPending || approveMut.isPending;

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
          <p className="vs-subtitle">Chỉnh cảnh</p>
        </div>
      </header>

      <section className="vs-panel">
        <span className="vs-label">Video thô</span>
        {/* Không dùng capture trên input chính — mobile mới mở Thư viện / file đã quay */}
        <input
          ref={galleryRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadMut.mutate(file);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="video/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadMut.mutate(file);
            e.target.value = '';
          }}
        />
        {scene.hasRawClip ? (
          <>
            <p className="vs-hint">Video đã lưu trên server.</p>
            <button
              type="button"
              className="vs-btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={busy}
              onClick={() => galleryRef.current?.click()}
            >
              Chọn video khác (thư viện)
            </button>
            <button
              type="button"
              className="vs-btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={busy}
              onClick={() => cameraRef.current?.click()}
            >
              Quay video mới
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="vs-upload-zone"
              disabled={busy}
              onClick={() => galleryRef.current?.click()}
            >
              <strong>Chọn video đã quay</strong>
              <span className="vs-hint">
                Thư viện ảnh / file · tối đa 80MB · 9:16 khuyến nghị
              </span>
            </button>
            <button
              type="button"
              className="vs-btn-secondary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={busy}
              onClick={() => cameraRef.current?.click()}
            >
              Quay video mới
            </button>
          </>
        )}
      </section>

      <section className="vs-panel">
        <span className="vs-label">Phân tích AI</span>
        <p className="vs-hint">
          GPT soạn lời đọc theo lô + loại cảnh (vision video — bổ sung sau).
        </p>
        {scene.aiNotes ? (
          <p className="vs-hint" style={{ marginTop: 4 }}>
            {scene.aiNotes}
          </p>
        ) : null}
      </section>

      <section className="vs-panel">
        <label className="vs-label" htmlFor="vs-narration">
          Lời thuyết minh
        </label>
        <textarea
          id="vs-narration"
          className="vs-textarea"
          value={narration}
          placeholder="Lời đọc ElevenLabs…"
          disabled={busy}
          onChange={(e) => setNarrationLocal(e.target.value)}
          onBlur={() => {
            if (narrationLocal !== null && narrationLocal !== scene.narrationText) {
              saveNarrMut.mutate(narrationLocal);
            }
          }}
        />
        <button
          type="button"
          className="vs-btn-secondary"
          style={{ width: '100%', marginTop: 8 }}
          disabled={busy}
          onClick={() => gptMut.mutate()}
        >
          {gptMut.isPending ? 'Đang gọi GPT…' : 'Tạo lại từ AI'}
        </button>
      </section>

      <footer className="vs-footer">
        <button
          type="button"
          className="vs-btn-primary"
          disabled={busy || !scene.hasRawClip}
          onClick={() => approveMut.mutate()}
        >
          Duyệt cảnh
        </button>
      </footer>

      <CrmToast message={toast} />
    </div>
  );
}
