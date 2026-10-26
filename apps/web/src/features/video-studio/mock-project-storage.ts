import {
  createDefaultScenes,
  type VideoSceneDraft,
} from './default-scenes';

const MAX_SCENES = 12;
const storageKey = (lodatId: string) => `crmanhung:video-studio:${lodatId}`;

export type VideoProjectMock = {
  lodatId: string;
  scenes: VideoSceneDraft[];
  updatedAt: string;
};

export function loadVideoProjectMock(lodatId: string): VideoProjectMock {
  if (typeof window === 'undefined') {
    return { lodatId, scenes: createDefaultScenes(), updatedAt: new Date().toISOString() };
  }
  try {
    const raw = sessionStorage.getItem(storageKey(lodatId));
    if (!raw) {
      return saveVideoProjectMock({
        lodatId,
        scenes: createDefaultScenes(),
        updatedAt: new Date().toISOString(),
      });
    }
    const parsed = JSON.parse(raw) as VideoProjectMock;
    if (parsed.lodatId !== lodatId || !Array.isArray(parsed.scenes)) {
      return saveVideoProjectMock({
        lodatId,
        scenes: createDefaultScenes(),
        updatedAt: new Date().toISOString(),
      });
    }
    return parsed;
  } catch {
    return saveVideoProjectMock({
      lodatId,
      scenes: createDefaultScenes(),
      updatedAt: new Date().toISOString(),
    });
  }
}

export function saveVideoProjectMock(project: VideoProjectMock): VideoProjectMock {
  const next = { ...project, updatedAt: new Date().toISOString() };
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(storageKey(project.lodatId), JSON.stringify(next));
  }
  return next;
}

export function canAddScene(scenes: VideoSceneDraft[]): boolean {
  return scenes.length < MAX_SCENES;
}

export function reorderScenes(
  scenes: VideoSceneDraft[],
  fromIndex: number,
  toIndex: number,
): VideoSceneDraft[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return scenes;
  const copy = [...scenes].sort((a, b) => a.sortOrder - b.sortOrder);
  const [item] = copy.splice(fromIndex, 1);
  if (!item) return scenes;
  copy.splice(toIndex, 0, item);
  return copy.map((s, i) => ({ ...s, sortOrder: i }));
}
