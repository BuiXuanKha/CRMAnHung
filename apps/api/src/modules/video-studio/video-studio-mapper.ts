import type { VideoProject, VideoScene } from '@crmanhung/shared';
import type { VideoProject as PrismaProject, VideoScene as PrismaScene } from '@prisma/client';

type ProjectRow = PrismaProject & { scenes: PrismaScene[] };

export function mapVideoProject(
  row: ProjectRow,
  exportDownloadUrl: string | null,
): VideoProject {
  return {
    id: row.id,
    lodatId: row.lodatId,
    status: row.status as VideoProject['status'],
    exportDownloadUrl,
    exportError: row.exportError,
    scenes: row.scenes
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(mapScene),
  };
}

function mapScene(scene: PrismaScene): VideoScene {
  return {
    id: scene.id,
    kind: scene.kind as VideoScene['kind'],
    customLabel: scene.customLabel,
    sortOrder: scene.sortOrder,
    status: scene.status as VideoScene['status'],
    hasRawClip: Boolean(scene.rawVideoObjectKey),
    narrationText: scene.narrationText,
    aiNotes: scene.aiNotes,
  };
}
