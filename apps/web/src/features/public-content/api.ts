import {
  createPublicPostInputSchema,
  setPublicPostStatusSchema,
  updatePublicListingDraftSchema,
  type CreatePublicPostInput,
  type PublicCatalogListing,
  type PublicCatalogListResponse,
  type PublicGuestPost,
  type PublicGuestPostListResponse,
  type PublicListingHub,
  type PublicListingHubDetail,
  type PublicListingHubListResponse,
  type PublicWebDashboard,
  type PublicWebLotRow,
  type PublicWebPostRow,
  type LotGptGenerateResponse,
  type LotGptRequestPayload,
  type PostGptGenerateResponse,
  type PostGptRequestPayload,
  type SetPublicPostStatusInput,
  type UpdatePublicListingDraftInput,
} from '@crmanhung/shared';
import { ApiError, apiFetch } from '@/shared/api/client';
import { isNextProductionBuild } from '@/features/public/next-production-build';
import { catalogToGuestLot, type PublicGuestLot } from './guest-listing';
import { buildPublicWebDashboard } from './public-web-dashboard-data';


export async function listPublicWebLots(): Promise<PublicWebLotRow[]> {
  return apiFetch<PublicWebLotRow[]>('/admin/public-web/lots');
}

export async function getPublicWebDashboard(): Promise<PublicWebDashboard> {
  // Admin Tổng quan = bài CMS. Lô đăng web không còn trên Dashboard.
  const posts = await listPublicWebPosts();
  return buildPublicWebDashboard([], posts);
}


/** Guest catalog — GET /public/listings (no JWT). */
export async function listPublishedCatalog(): Promise<PublicCatalogListing[]> {
  // BUG-072: do not treat API outages as an empty catalog (sitemap / SEO).
  const res = await apiFetch<PublicCatalogListResponse>('/public/listings');
  return res.items;
}

export async function getPublishedCatalogBySlug(
  slug: string,
): Promise<PublicCatalogListing | null> {
  try {
    return await apiFetch<PublicCatalogListing>(
      `/public/listings/${encodeURIComponent(slug)}`,
    );
  } catch (err) {
    // Missing / unpublished listing only — other failures must propagate (BUG-072).
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** Guest listing hubs — GET /public/listing-hubs (no JWT). */
export async function listCommuneHubsFromApi(): Promise<PublicListingHub[] | null> {
  try {
    const res = await apiFetch<PublicListingHubListResponse>('/public/listing-hubs/communes');
    return res.items;
  } catch {
    return null;
  }
}

/** null = 404; undefined = API unavailable (fallback). */
export async function getCommuneHubDetailFromApi(
  communeSlug: string,
): Promise<PublicListingHubDetail | null | undefined> {
  try {
    return await apiFetch<PublicListingHubDetail>(
      `/public/listing-hubs/communes/${encodeURIComponent(communeSlug)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return undefined;
  }
}

/** Old commune hub slug → current slug after xã rename (301 on guest). */
export async function getCommuneHubRedirect(
  fromSlug: string,
): Promise<string | null> {
  try {
    const row = await apiFetch<{ toSlug: string }>(
      `/public/listing-hubs/commune-redirects/${encodeURIComponent(fromSlug)}`,
    );
    return row.toSlug?.trim() || null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return null;
  }
}

export async function listPlaceHubsFromApi(
  communeSlug?: string,
): Promise<PublicListingHub[] | null> {
  const qs = communeSlug?.trim()
    ? `?commune=${encodeURIComponent(communeSlug.trim())}`
    : '';
  try {
    const res = await apiFetch<PublicListingHubListResponse>(
      `/public/listing-hubs/places${qs}`,
    );
    return res.items;
  } catch {
    return null;
  }
}

/** null = 404; undefined = API unavailable (fallback). */
export async function getPlaceHubDetailFromApi(
  communeSlug: string,
  placeSlug: string,
): Promise<PublicListingHubDetail | null | undefined> {
  try {
    return await apiFetch<PublicListingHubDetail>(
      `/public/listing-hubs/communes/${encodeURIComponent(communeSlug)}/places/${encodeURIComponent(placeSlug)}`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    return undefined;
  }
}

/** Old lot slug → current slug after title+location regen (301 on guest). */
export async function getPublicLotSlugRedirect(
  fromSlug: string,
): Promise<string | null> {
  try {
    const row = await apiFetch<{ toSlug: string }>(
      `/public/slug-redirects/${encodeURIComponent(fromSlug)}`,
    );
    return row.toSlug?.trim() || null;
  } catch (err) {
    // No redirect row only — other failures must propagate (BUG-072).
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function listPublishedPublicLots(): Promise<PublicGuestLot[]> {
  try {
    const items = await listPublishedCatalog();
    return items.map(catalogToGuestLot);
  } catch (err) {
    // CI `next build` has no Nest — soft-fail only during production build collect.
    if (isNextProductionBuild()) return [];
    throw err;
  }
}

export async function listPublicWebPosts(): Promise<PublicWebPostRow[]> {
  return apiFetch<PublicWebPostRow[]>('/admin/public-web/posts');
}


export async function updatePublicListingDraft(
  id: string,
  input: UpdatePublicListingDraftInput,
): Promise<PublicWebLotRow> {
  const parsed = updatePublicListingDraftSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không lưu được bài đăng.');
  }
  return apiFetch<PublicWebLotRow>(`/admin/public-web/lots/${encodeURIComponent(id)}/draft`, {
    method: 'PATCH',
    body: JSON.stringify(parsed.data),
  });
}

export async function setPublicPostStatus(
  id: string,
  input: SetPublicPostStatusInput,
): Promise<PublicWebPostRow> {
  const parsed = setPublicPostStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không đổi được trạng thái bài.');
  }
  return apiFetch<PublicWebPostRow>(
    `/admin/public-web/posts/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(parsed.data),
    },
  );
}

export async function createPublicPost(
  input: CreatePublicPostInput,
): Promise<PublicWebPostRow> {
  const parsed = createPublicPostInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không lưu được bài viết.');
  }
  return apiFetch<PublicWebPostRow>('/admin/public-web/posts', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
}

/** Guest published posts — GET /public/posts (no JWT). */
export async function listPublishedPosts(
  category?: string,
): Promise<PublicGuestPost[]> {
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
  return apiFetch<LotGptGenerateResponse>('/admin/public-web/lots/gpt-content', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generatePostGptContent(
  payload: PostGptRequestPayload,
): Promise<PostGptGenerateResponse> {
  return apiFetch<PostGptGenerateResponse>('/admin/public-web/posts/gpt-content', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
