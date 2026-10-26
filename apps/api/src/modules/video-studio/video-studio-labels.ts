/** Runtime copy — Nest CJS không import enum record từ @crmanhung/shared. */
export const VIDEO_SCENE_KIND_LABELS: Record<string, string> = {
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

export const DEFAULT_SCENE_KINDS = [
  'PROPERTY_HERO',
  'PROPERTY_DETAIL',
  'LOCATION_CONTEXT',
  'VALUE_PROPOSITION',
  'CALL_TO_ACTION',
] as const;

export function sceneDisplayTitle(kind: string, customLabel: string | null): string {
  if (kind === 'POI_CUSTOM' && customLabel?.trim()) {
    return customLabel.trim();
  }
  return VIDEO_SCENE_KIND_LABELS[kind] ?? kind;
}
