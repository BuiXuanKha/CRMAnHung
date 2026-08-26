import {
  LODAT_LIST_MAX_PAGE_SIZE,
  LodatSaleStatus,
  createPublicPostInputSchema,
  setPublicLotPublishedSchema,
  setPublicPostStatusSchema,
  updatePublicListingDraftSchema,
  type CreatePublicPostInput,
  type PublicWebDashboard,
  type PublicWebLotRow,
  type PublicWebPostRow,
  type PublicWebStaffLotRow,
  type SetPublicLotPublishedInput,
  type SetPublicPostStatusInput,
  type UpdatePublicListingDraftInput,
} from '@crmanhung/shared';
import { listLodats } from '@/features/lodats/api';
import { toPublicSlug } from './display';
import { publishedStaffLotsToGuest, type PublicGuestLot } from './guest-listing';
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

async function loadOpenPlots() {
  const res = await listLodats({
    status: LodatSaleStatus.DANG_BAN,
    limit: LODAT_LIST_MAX_PAGE_SIZE,
  });
  return res.items;
}

/** Chưa có API CMS — listing public mock; lô nguồn = list `/lo-dat`. */
export async function getPublicWebDashboard(): Promise<PublicWebDashboard> {
  const staff = buildStaffOpenLots(await loadOpenPlots(), cloneLots());
  return buildPublicWebDashboard(cloneLots(), clonePosts(), staff);
}

export async function listPublicWebLots(): Promise<PublicWebLotRow[]> {
  return cloneLots();
}

export async function listStaffOpenLots(): Promise<PublicWebStaffLotRow[]> {
  return buildStaffOpenLots(await loadOpenPlots(), cloneLots());
}

/**
 * Guest homepage / public list: CRM lots đang Mở bán whose overlay is published.
 * Overlay (`listPublicWebLots`) is the Đăng web flag; paused CRM lots drop out.
 */
export async function listPublishedPublicLots(): Promise<PublicGuestLot[]> {
  const overlay = await listPublicWebLots();
  const publishedIds = new Set(
    overlay.filter((row) => row.isPublished).map((row) => row.lodatId),
  );
  if (publishedIds.size === 0) return [];
  const staff = await listStaffOpenLots();
  return publishedStaffLotsToGuest(staff.filter((row) => publishedIds.has(row.lodatId)));
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

  const staff = buildStaffOpenLots(await loadOpenPlots(), lots);
  const source = staff.find((row) => row.id === id || row.lodatId === id);
  if (!source) throw new Error('Không tìm thấy lô đang mở bán.');

  const index = lots.findIndex((row) => row.lodatId === source.lodatId);

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

export async function updatePublicListingDraft(
  id: string,
  input: UpdatePublicListingDraftInput,
): Promise<PublicWebLotRow> {
  const parsed = updatePublicListingDraftSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không lưu được bài đăng.');
  }

  const staff = buildStaffOpenLots(await loadOpenPlots(), lots);
  const source = staff.find((row) => row.id === id || row.lodatId === id);
  if (!source) throw new Error('Không tìm thấy lô đang mở bán.');

  const draft = parsed.data;
  const priceLabel = draft.priceMode === 'CONTACT' ? null : draft.priceLabel;
  const index = lots.findIndex((row) => row.lodatId === source.lodatId);

  if (index < 0) {
    const created = listingFromStaffLot({
      ...source,
      title: draft.title,
      location: draft.location,
      priceMode: draft.priceMode,
      priceLabel,
      excerpt: draft.excerpt,
    });
    lots = [created, ...lots];
    return { ...created };
  }

  lots[index] = {
    ...lots[index],
    title: draft.title,
    location: draft.location,
    priceMode: draft.priceMode,
    priceLabel,
    excerpt: draft.excerpt,
  };
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
