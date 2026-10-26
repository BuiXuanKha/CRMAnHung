import {
  VIDEO_POI_PRESETS,
  VIDEO_SCENE_KIND_LABELS,
  type VideoSceneKind,
  type VideoSceneStatus,
} from '@crmanhung/shared';

export type { VideoSceneKind, VideoSceneStatus };

export type SceneView = {
  id: string;
  kind: VideoSceneKind;
  customLabel?: string | null;
  sortOrder: number;
  status: VideoSceneStatus;
  hasRawClip: boolean;
  narrationText: string;
};

export const SCENE_KIND_LABELS = VIDEO_SCENE_KIND_LABELS;
export const POI_PRESETS = VIDEO_POI_PRESETS;

export function sceneTitle(scene: {
  kind: VideoSceneKind;
  customLabel?: string | null;
}): string {
  if (scene.kind === 'POI_CUSTOM' && scene.customLabel?.trim()) {
    return scene.customLabel.trim();
  }
  return SCENE_KIND_LABELS[scene.kind] ?? scene.kind;
}
