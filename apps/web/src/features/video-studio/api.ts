import {
  addVideoSceneSchema,
  reorderVideoScenesSchema,
  updateVideoSceneSchema,
  type AddVideoSceneInput,
  type ReorderVideoScenesInput,
  type UpdateVideoSceneInput,
  type VideoProject,
  type VideoSceneKind,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';

export async function getVideoProjectForLodat(lodatId: string): Promise<VideoProject> {
  return apiFetch<VideoProject>(`/video-projects/lodat/${lodatId}`);
}

export async function getVideoProject(projectId: string): Promise<VideoProject> {
  return apiFetch<VideoProject>(`/video-projects/${projectId}`);
}

export async function updateVideoScene(
  projectId: string,
  sceneId: string,
  input: UpdateVideoSceneInput,
): Promise<VideoProject> {
  const body = updateVideoSceneSchema.parse(input);
  return apiFetch<VideoProject>(`/video-projects/${projectId}/scenes/${sceneId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function addVideoScene(
  projectId: string,
  input: AddVideoSceneInput,
): Promise<VideoProject> {
  const body = addVideoSceneSchema.parse(input);
  return apiFetch<VideoProject>(`/video-projects/${projectId}/scenes`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function reorderVideoScenes(
  projectId: string,
  input: ReorderVideoScenesInput,
): Promise<VideoProject> {
  const body = reorderVideoScenesSchema.parse(input);
  return apiFetch<VideoProject>(`/video-projects/${projectId}/scenes/reorder`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function uploadSceneRawVideo(
  projectId: string,
  sceneId: string,
  file: File,
): Promise<VideoProject> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<VideoProject>(
    `/video-projects/${projectId}/scenes/${sceneId}/raw-video`,
    { method: 'POST', body: form },
  );
}

export async function generateSceneNarration(
  projectId: string,
  sceneId: string,
): Promise<VideoProject> {
  return apiFetch<VideoProject>(
    `/video-projects/${projectId}/scenes/${sceneId}/generate-narration`,
    { method: 'POST' },
  );
}

export async function exportVideoProject(projectId: string): Promise<VideoProject> {
  return apiFetch<VideoProject>(`/video-projects/${projectId}/export`, {
    method: 'POST',
  });
}

export type { VideoSceneKind };
