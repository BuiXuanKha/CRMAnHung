/** Mock slice 1 — replace with API + shared contract later. */
export type VideoSceneKind =
  | 'PROPERTY_HERO'
  | 'PROPERTY_DETAIL'
  | 'LOCATION_CONTEXT'
  | 'VALUE_PROPOSITION'
  | 'CALL_TO_ACTION'
  | 'POI_UTILITY'
  | 'POI_SCHOOL'
  | 'POI_MARKET'
  | 'POI_HOSPITAL'
  | 'POI_TRANSPORT'
  | 'POI_CUSTOM';

export type VideoSceneStatus = 'draft' | 'approved';

export type VideoSceneDraft = {
  id: string;
  kind: VideoSceneKind;
  customLabel?: string;
  sortOrder: number;
  status: VideoSceneStatus;
  hasRawClip: boolean;
  narrationText: string;
};

export const SCENE_KIND_LABELS: Record<VideoSceneKind, string> = {
  PROPERTY_HERO: 'Tổng quan lô',
  PROPERTY_DETAIL: 'Chi tiết thửa',
  LOCATION_CONTEXT: 'Vị trí / khu vực',
  VALUE_PROPOSITION: 'Điểm mạnh',
  CALL_TO_ACTION: 'Kêu gọi liên hệ',
  POI_UTILITY: 'Tiện ích',
  POI_SCHOOL: 'Trường học',
  POI_MARKET: 'Chợ / siêu thị',
  POI_HOSPITAL: 'Y tế',
  POI_TRANSPORT: 'Giao thông',
  POI_CUSTOM: 'Địa điểm khác',
};

export const POI_PRESETS: VideoSceneKind[] = [
  'POI_UTILITY',
  'POI_SCHOOL',
  'POI_MARKET',
  'POI_HOSPITAL',
  'POI_TRANSPORT',
  'POI_CUSTOM',
];

const DEFAULT_KINDS: VideoSceneKind[] = [
  'PROPERTY_HERO',
  'PROPERTY_DETAIL',
  'LOCATION_CONTEXT',
  'VALUE_PROPOSITION',
  'CALL_TO_ACTION',
];

export function createDefaultScenes(): VideoSceneDraft[] {
  return DEFAULT_KINDS.map((kind, index) => ({
    id: `scene-${kind.toLowerCase()}-${index}`,
    kind,
    sortOrder: index,
    status: 'draft',
    hasRawClip: false,
    narrationText: '',
  }));
}

export function sceneTitle(scene: VideoSceneDraft): string {
  if (scene.kind === 'POI_CUSTOM' && scene.customLabel?.trim()) {
    return scene.customLabel.trim();
  }
  return SCENE_KIND_LABELS[scene.kind];
}

export function newSceneId(): string {
  return `scene-${Date.now().toString(36)}`;
}
