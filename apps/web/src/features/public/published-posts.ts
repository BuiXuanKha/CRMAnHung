import {
  PublicPostCategory,
  PUBLIC_POST_CATEGORY_LABELS,
  clipMetaDescription,
  type PublicGuestPost,
} from '@crmanhung/shared';
import {
  getPublishedPostByCategorySlug,
  listPublishedPosts,
} from '@/features/public-content/api';

export { shouldShowPostLead } from '@crmanhung/shared';

const CATEGORY_SET = new Set<string>(Object.values(PublicPostCategory));

export function isPublicPostCategory(value: string): value is PublicPostCategory {
  return CATEGORY_SET.has(value);
}

export function publicPostCategoryLabel(category: string): string {
  if (isPublicPostCategory(category)) return PUBLIC_POST_CATEGORY_LABELS[category];
  return category;
}

export function postHref(category: string, slug: string): string {
  return `/${category}/${slug}`;
}

/** Card teaser only — never dump a stored 2000-char body into list UI. */
export function teaserExcerpt(text: string): string {
  return clipMetaDescription(text);
}

export async function listPublicGuestPosts(
  category?: PublicPostCategory,
): Promise<PublicGuestPost[]> {
  return (await listPublishedPosts(category)) as PublicGuestPost[];
}

export async function getPublicGuestPost(
  category: string,
  slug: string,
): Promise<PublicGuestPost | null> {
  if (!isPublicPostCategory(category)) return null;
  return (await getPublishedPostByCategorySlug(category, slug)) as PublicGuestPost | null;
}

export async function listSitemapPosts(): Promise<PublicGuestPost[]> {
  return (await listPublishedPosts()) as PublicGuestPost[];
}

/** Homepage «Dự án nổi bật» — bài chuyên mục Dự án, mới nhất trước. */
export async function listHomeProjectPosts(limit = 3): Promise<PublicGuestPost[]> {
  const items = await listPublicGuestPosts(PublicPostCategory.DU_AN);
  return items.slice(0, limit);
}

/** Homepage tin/kiến thức — không lặp bài đã hiện ở «Dự án nổi bật». */
export async function listHomeTeaserPosts(limit = 6): Promise<PublicGuestPost[]> {
  const items = await listPublicGuestPosts();
  return items
    .filter((row) => row.category !== PublicPostCategory.DU_AN)
    .slice(0, limit);
}
