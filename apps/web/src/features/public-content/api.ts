import {
  LODAT_LIST_MAX_PAGE_SIZE,
  LodatSaleStatus,
  createPublicPostInputSchema,
  listingBodyToExcerpt,
  setPublicLotPublishedSchema,
  setPublicPostStatusSchema,
  updatePublicListingDraftSchema,
  type CreatePublicPostInput,
  type PublicCatalogListing,
  type PublicCatalogListResponse,
  type PublicGuestPost,
  type PublicGuestPostListResponse,
  type PublicWebDashboard,
  type PublicWebLotRow,
  type PublicWebPostRow,
  type PublicWebStaffLotRow,
  type LotGptGenerateResponse,
  type LotGptRequestPayload,
  type SetPublicLotPublishedInput,
  type SetPublicPostStatusInput,
  type UpdatePublicListingDraftInput,
} from '@crmanhung/shared';
import { ApiError, apiFetch } from '@/shared/api/client';
import { isMockPublicWeb } from '@/shared/api/mode';
import { listLodats } from '@/features/lodats/api';
import { toPublicSlug } from './display';
import { overlayRowToGuestLot, type PublicGuestLot } from './guest-listing';
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

function overlayToCatalog(row: PublicWebLotRow): PublicCatalogListing | null {
  if (!row.isPublished) return null;
  const priceLabel =
    row.priceMode === 'CONTACT' || !row.priceLabel?.trim() ? null : row.priceLabel;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    location: row.location,
    priceLabel,
    excerpt: row.excerpt?.trim() || [row.title, row.location].filter(Boolean).join('. '),
    bodyHtml: row.bodyHtml ?? '',
    coverImageUrl: row.coverImageUrl,
    ...(row.coverImageUrl ? { imageUrls: [row.coverImageUrl] } : {}),
    kindLabel: 'Nhà đất',
    areaLabel: null,
    frontageLabel: null,
    directionLabel: null,
  };
}

async function loadOpenPlots() {
  const res = await listLodats({
    status: LodatSaleStatus.DANG_BAN,
    limit: LODAT_LIST_MAX_PAGE_SIZE,
  });
  return res.items;
}

export async function listPublicWebLots(): Promise<PublicWebLotRow[]> {
  if (isMockPublicWeb()) return cloneLots();
  return apiFetch<PublicWebLotRow[]>('/admin/public-web/lots');
}

export async function getPublicWebDashboard(): Promise<PublicWebDashboard> {
  const overlay = await listPublicWebLots();
  const posts = await listPublicWebPosts();
  const staff = buildStaffOpenLots(await loadOpenPlots(), overlay);
  return buildPublicWebDashboard(overlay, posts, staff);
}

export async function listStaffOpenLots(): Promise<PublicWebStaffLotRow[]> {
  return buildStaffOpenLots(await loadOpenPlots(), await listPublicWebLots());
}

/** Guest catalog — GET /public/listings (no JWT). Mock overlay when login giả. */
export async function listPublishedCatalog(): Promise<PublicCatalogListing[]> {
  if (isMockPublicWeb()) {
    return cloneLots()
      .map(overlayToCatalog)
      .filter((row): row is PublicCatalogListing => row != null);
  }
  try {
    const res = await apiFetch<PublicCatalogListResponse>('/public/listings');
    return res.items;
  } catch {
    // next build: API chưa chạy — đừng crash collect page data.
    return [];
  }
}

export async function getPublishedCatalogBySlug(
  slug: string,
): Promise<PublicCatalogListing | null> {
  if (isMockPublicWeb()) {
    const row = cloneLots().find((item) => item.slug === slug);
    return row ? overlayToCatalog(row) : null;
  }
  try {
    return await apiFetch<PublicCatalogListing>(
      `/public/listings/${encodeURIComponent(slug)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return null;
  }
}

/** Old lot slug → current slug after title+location regen (301 on guest). */
export async function getPublicLotSlugRedirect(
  fromSlug: string,
): Promise<string | null> {
  if (isMockPublicWeb()) return null;
  try {
    const row = await apiFetch<{ toSlug: string }>(
      `/public/slug-redirects/${encodeURIComponent(fromSlug)}`,
    );
    return row.toSlug?.trim() || null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return null;
  }
}

export async function listPublishedPublicLots(): Promise<PublicGuestLot[]> {
  const items = await listPublishedCatalog();
  return items.map((row) =>
    overlayRowToGuestLot({
      id: row.id,
      slug: row.slug,
      title: row.title,
      location: row.location,
      coverImageUrl: row.coverImageUrl,
      priceLabel: row.priceLabel,
    }),
  );
}

export async function listPublicWebPosts(): Promise<PublicWebPostRow[]> {
  if (isMockPublicWeb()) return clonePosts();
  return apiFetch<PublicWebPostRow[]>('/admin/public-web/posts');
}

export async function setPublicLotPublished(
  id: string,
  input: SetPublicLotPublishedInput,
): Promise<PublicWebLotRow> {
  const parsed = setPublicLotPublishedSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không đổi được trạng thái lô.');
  }
  if (!isMockPublicWeb()) {
    return apiFetch<PublicWebLotRow>(`/admin/public-web/lots/${encodeURIComponent(id)}/published`, {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    });
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
  if (!isMockPublicWeb()) {
    return apiFetch<PublicWebLotRow>(`/admin/public-web/lots/${encodeURIComponent(id)}/draft`, {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    });
  }

  const staff = buildStaffOpenLots(await loadOpenPlots(), lots);
  const source = staff.find((row) => row.id === id || row.lodatId === id);
  if (!source) throw new Error('Không tìm thấy lô đang mở bán.');

  const draft = parsed.data;
  const priceLabel = draft.priceMode === 'CONTACT' ? null : draft.priceLabel;
  const bodyHtml = draft.bodyHtml ?? '';
  const excerpt =
    listingBodyToExcerpt(bodyHtml) ||
    [draft.title, draft.location].filter(Boolean).join('. ');
  const index = lots.findIndex((row) => row.lodatId === source.lodatId);

  if (index < 0) {
    const created = listingFromStaffLot({
      ...source,
      title: draft.title,
      location: draft.location,
      priceMode: draft.priceMode,
      priceLabel,
      excerpt,
      bodyHtml,
      ...(draft.slug ? { slug: draft.slug } : {}),
      ...(draft.metaDescription !== undefined ? { metaDescription: draft.metaDescription } : {}),
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
    excerpt,
    bodyHtml,
    ...(draft.slug ? { slug: draft.slug } : {}),
    ...(draft.metaDescription !== undefined ? { metaDescription: draft.metaDescription } : {}),
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
  if (!isMockPublicWeb()) {
    return apiFetch<PublicWebPostRow>(
      `/admin/public-web/posts/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(parsed.data),
      },
    );
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
  if (!isMockPublicWeb()) {
    return apiFetch<PublicWebPostRow>('/admin/public-web/posts', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
  }
  const row: PublicWebPostRow = {
    id: `pp-${Date.now()}`,
    slug: uniquePostSlug(parsed.data.title),
    title: parsed.data.title,
    category: parsed.data.category,
    status: parsed.data.status,
    coverImageUrl: parsed.data.coverImageUrl ?? null,
    bodyHtml: parsed.data.bodyHtml ?? '',
    excerpt: parsed.data.excerpt,
  };
  posts = [row, ...posts];
  return { ...row };
}

/** Guest published posts — GET /public/posts (no JWT). */
export async function listPublishedPosts(
  category?: string,
): Promise<PublicGuestPost[]> {
  if (isMockPublicWeb()) {
    return clonePosts()
      .filter((row) => row.status === 'PUBLISHED')
      .filter((row) => !category || row.category === category)
      .map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        category: row.category,
        coverImageUrl: row.coverImageUrl,
        bodyHtml: row.bodyHtml,
        excerpt: row.excerpt?.trim() || row.title,
      }));
  }
  try {
    const qs = category ? `?category=${encodeURIComponent(category)}` : '';
    const res = await apiFetch<PublicGuestPostListResponse>(`/public/posts${qs}`);
    return res.items;
  } catch {
    return [];
  }
}

export async function getPublishedPostByCategorySlug(
  category: string,
  slug: string,
): Promise<PublicGuestPost | null> {
  if (isMockPublicWeb()) {
    const row = clonePosts().find(
      (item) =>
        item.category === category &&
        item.slug === slug &&
        item.status === 'PUBLISHED',
    );
    if (!row) return null;
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      coverImageUrl: row.coverImageUrl,
      bodyHtml: row.bodyHtml,
      excerpt: row.excerpt?.trim() || row.title,
    };
  }
  try {
    return await apiFetch<PublicGuestPost>(
      `/public/posts/${encodeURIComponent(category)}/${encodeURIComponent(slug)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return null;
  }
}

export async function generateLotGptContent(
  payload: LotGptRequestPayload,
): Promise<LotGptGenerateResponse> {
  if (isMockPublicWeb()) {
    return {
      content: `${JSON.stringify(
        {
          title: payload.title,
          excerpt: `[Mock] ${payload.title} — ${payload.location.commune}, ${payload.location.district}.`,
          bodyHtml: `<p>Mock GPT cho lô <strong>${payload.title}</strong>.</p>`,
          metaDescription: `[Mock] ${payload.title}`,
        },
        null,
        2,
      )}\n`,
    };
  }
  return apiFetch<LotGptGenerateResponse>('/admin/public-web/lots/gpt-content', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
