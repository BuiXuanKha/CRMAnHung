import { z } from 'zod';

export const videoSceneKindSchema = z.enum([
  'PROPERTY_HERO',
  'PROPERTY_DETAIL',
  'LOCATION_CONTEXT',
  'VALUE_PROPOSITION',
  'CALL_TO_ACTION',
  'POI_UTILITY',
  'POI_SCHOOL',
  'POI_MARKET',
  'POI_HOSPITAL',
  'POI_TRANSPORT',
  'POI_CUSTOM',
]);

export type VideoSceneKind = z.infer<typeof videoSceneKindSchema>;

export const videoSceneStatusSchema = z.enum(['draft', 'approved']);
export type VideoSceneStatus = z.infer<typeof videoSceneStatusSchema>;

export const videoProjectStatusSchema = z.enum([
  'DRAFT',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);
export type VideoProjectStatus = z.infer<typeof videoProjectStatusSchema>;

export const videoSceneSchema = z.object({
  id: z.string(),
  kind: videoSceneKindSchema,
  customLabel: z.string().nullable(),
  sortOrder: z.number().int(),
  status: videoSceneStatusSchema,
  hasRawClip: z.boolean(),
  narrationText: z.string(),
  aiNotes: z.string().nullable(),
});

export type VideoScene = z.infer<typeof videoSceneSchema>;

export const videoProjectSchema = z.object({
  id: z.string(),
  lodatId: z.string(),
  status: videoProjectStatusSchema,
  exportDownloadUrl: z.string().nullable(),
  exportError: z.string().nullable(),
  scenes: z.array(videoSceneSchema),
});

export type VideoProject = z.infer<typeof videoProjectSchema>;

export const updateVideoSceneSchema = z.object({
  narrationText: z.string().max(8000).optional(),
  customLabel: z.string().max(120).optional(),
  status: videoSceneStatusSchema.optional(),
});

export type UpdateVideoSceneInput = z.infer<typeof updateVideoSceneSchema>;

export const addVideoSceneSchema = z.object({
  kind: videoSceneKindSchema,
  customLabel: z.string().max(120).optional(),
});

export type AddVideoSceneInput = z.infer<typeof addVideoSceneSchema>;

export const reorderVideoScenesSchema = z.object({
  sceneIds: z.array(z.string().min(1)).min(1).max(12),
});

export type ReorderVideoScenesInput = z.infer<typeof reorderVideoScenesSchema>;

/** UI + API labels — tiếng Việt */
export const VIDEO_SCENE_KIND_LABELS: Record<VideoSceneKind, string> = {
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

export const VIDEO_POI_PRESETS: VideoSceneKind[] = [
  'POI_UTILITY',
  'POI_SCHOOL',
  'POI_MARKET',
  'POI_HOSPITAL',
  'POI_TRANSPORT',
  'POI_CUSTOM',
];
