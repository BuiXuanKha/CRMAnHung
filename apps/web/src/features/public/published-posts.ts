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
import { isMockPublicWeb } from '@/shared/api/mode';
import { PUBLIC_ARTICLES } from './mock-data';

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

function mockArticlesAsGuest(): PublicGuestPost[] {
  return PUBLIC_ARTICLES.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    category: a.category as PublicPostCategory,
    coverImageUrl: a.imageUrl,
    excerpt: a.excerpt,
    bodyHtml: `<p>${a.excerpt}</p>`,
  }));
}

export async function listPublicGuestPosts(
  category?: PublicPostCategory,
): Promise<PublicGuestPost[]> {
  const items = (await listPublishedPosts(category)) as PublicGuestPost[];
  if (items.length > 0) return items;
  if (!isMockPublicWeb()) return [];
  const mock = mockArticlesAsGuest();
  return category ? mock.filter((row) => row.category === category) : mock;
}

export async function getPublicGuestPost(
  category: string,
  slug: string,
): Promise<PublicGuestPost | null> {
  if (!isPublicPostCategory(category)) return null;
  const fromApi = (await getPublishedPostByCategorySlug(category, slug)) as PublicGuestPost | null;
  if (fromApi) return fromApi;
  if (!isMockPublicWeb()) return null;
  return mockArticlesAsGuest().find((row) => row.category === category && row.slug === slug) ?? null;
}

export async function listSitemapPosts(): Promise<PublicGuestPost[]> {
  const items = (await listPublishedPosts()) as PublicGuestPost[];
  if (items.length > 0) return items;
  return isMockPublicWeb() ? mockArticlesAsGuest() : [];
}

export async function listHomeTeaserPosts(limit = 6): Promise<PublicGuestPost[]> {
  const items = await listPublicGuestPosts();
  return items.slice(0, limit);
}
