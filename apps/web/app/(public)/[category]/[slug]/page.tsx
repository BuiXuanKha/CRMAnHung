import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/features/public/json-ld';
import { PostArticleView } from '@/features/public/post-article-view';
import {
  getPublicGuestPost,
  isPublicPostCategory,
  listPublicGuestPosts,
} from '@/features/public/published-posts';
import {
  postArticleJsonLd,
  postBreadcrumbJsonLd,
  postMetadata,
  unpublishedPostMetadata,
} from '@/features/public/post-seo';

type Props = { params: Promise<{ category: string; slug: string }> };

export const revalidate = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const post = await getPublicGuestPost(category, slug);
  if (!post) return unpublishedPostMetadata();
  return postMetadata(post);
}

export default async function PublicPostDetailPage({ params }: Props) {
  const { category, slug } = await params;
  if (!isPublicPostCategory(category)) notFound();
  const post = await getPublicGuestPost(category, slug);
  if (!post) notFound();
  const related = (await listPublicGuestPosts(category))
    .filter((row) => row.slug !== post.slug)
    .slice(0, 3);
  return (
    <>
      <JsonLd data={postArticleJsonLd(post)} />
      <JsonLd data={postBreadcrumbJsonLd(post)} />
      <PostArticleView post={post} related={related} />
    </>
  );
}
