import {
  createPublicPostInputSchema,
  setPublicLotPublishedSchema,
  setPublicPostStatusSchema,
  type CreatePublicPostInput,
  type PublicWebDashboard,
  type PublicWebLotRow,
  type PublicWebPostRow,
  type PublicWebStaffLotRow,
  type SetPublicLotPublishedInput,
  type SetPublicPostStatusInput,
} from '@crmanhung/shared';
import { toPublicSlug } from './display';
import {
  MOCK_PUBLIC_WEB_LOTS,
  MOCK_PUBLIC_WEB_POSTS,
  buildPublicWebDashboard,
  buildStaffOpenLots,
  listingFromStaffLot,
} from './mock-data';

let lots: PublicWebLotRow[] = structuredClone(MOCK_PUBLIC_WEB_LOTS);
let posts: PublicWebPostRow[] = structuredClone(MOCK_PUBLIC_WEB_POSTS);

function cloneLots(): PublicWebLotRow[] {
  return lots.map((row) => ({ ...row }));
}

function clonePosts(): PublicWebPostRow[] {
  return posts.map((row) => ({ ...row }));
}

function uniquePostSlug(title: string): string {
  const base = toPublicSlug(title);
  const used = new Set(posts.map((row) => row.slug));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Chưa có API — mock dashboard admin đăng web. */
export async function getPublicWebDashboard(): Promise<PublicWebDashboard> {
  return buildPublicWebDashboard(cloneLots(), clonePosts());
}

export async function listPublicWebLots(): Promise<PublicWebLotRow[]> {
  return cloneLots();
}

export async function listStaffOpenLots(): Promise<PublicWebStaffLotRow[]> {
  return buildStaffOpenLots(cloneLots());
}

export async function listPublicWebPosts(): Promise<PublicWebPostRow[]> {
  return clonePosts();
}

export async function setPublicLotPublished(
  id: string,
  input: SetPublicLotPublishedInput,
): Promise<PublicWebLotRow> {
  const parsed = setPublicLotPublishedSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không đổi được trạng thái lô.');
  }

  const staff = buildStaffOpenLots(lots);
  const source = staff.find((row) => row.id === id || row.lodatId === id);
  if (!source) throw new Error('Không tìm thấy lô đang mở bán.');

  let index = lots.findIndex((row) => row.lodatId === source.lodatId);

  if (index < 0) {
    const created = listingFromStaffLot({
      ...source,
      isPublished: parsed.data.isPublished,
    });
    lots = [created, ...lots];
    return { ...created };
  }

  lots[index] = { ...lots[index], isPublished: parsed.data.isPublished };
  return { ...lots[index] };
}

export async function setPublicPostStatus(
  id: string,
  input: SetPublicPostStatusInput,
): Promise<PublicWebPostRow> {
  const parsed = setPublicPostStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không đổi được trạng thái bài.');
  }
  const index = posts.findIndex((row) => row.id === id);
  if (index < 0) throw new Error('Không tìm thấy bài viết.');
  posts[index] = { ...posts[index], status: parsed.data.status };
  return { ...posts[index] };
}

export async function createPublicPost(
  input: CreatePublicPostInput,
): Promise<PublicWebPostRow> {
  const parsed = createPublicPostInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không lưu được bài viết.');
  }
  const row: PublicWebPostRow = {
    id: `pp-${Date.now()}`,
    slug: uniquePostSlug(parsed.data.title),
    title: parsed.data.title,
    category: parsed.data.category,
    status: parsed.data.status,
  };
  posts = [row, ...posts];
  return { ...row };
}
