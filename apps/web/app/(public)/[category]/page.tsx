import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicPostCategory } from '@crmanhung/shared';
import { JsonLd } from '@/features/public/json-ld';
import { PostArticleView } from '@/features/public/post-article-view';
import {
  isPublicPostCategory,
  listPublicGuestPosts,
  postHref,
  publicPostCategoryLabel,
  teaserExcerpt,
} from '@/features/public/published-posts';
import {
  categoryListMetadata,
  postArticleJsonLd,
  postBreadcrumbJsonLd,
  postItemListJsonLd,
  postMetadata,
} from '@/features/public/post-seo';
import '@/features/public/public-home.css';

type Props = { params: Promise<{ category: string }> };

/** Chuyên mục thường chỉ một trang nội dung — hiện luôn bài thay vì list trống/1 thẻ. */
const SINGLE_PAGE_CATEGORIES = new Set<string>([
  PublicPostCategory.LIEN_HE,
  PublicPostCategory.CHINH_SACH,
]);

export const revalidate = false;

export function generateStaticParams() {
  return Object.values(PublicPostCategory).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isPublicPostCategory(category)) {
    // BUG-076: clear layout homepage canonical on invalid category soft-404.
    return {
      title: 'Không tìm thấy',
      robots: { index: false, follow: false },
      alternates: { canonical: null },
    };
  }
  if (SINGLE_PAGE_CATEGORIES.has(category)) {
    const posts = await listPublicGuestPosts(category);
    if (posts[0]) return postMetadata(posts[0]);
  }
  return categoryListMetadata(category);
}

export default async function PublicCategoryListPage({ params }: Props) {
  const { category } = await params;
  if (!isPublicPostCategory(category)) notFound();

  const posts = await listPublicGuestPosts(category);
  const label = publicPostCategoryLabel(category);

  if (SINGLE_PAGE_CATEGORIES.has(category) && posts[0]) {
    const post = posts[0];
    return (
      <>
        <JsonLd data={postArticleJsonLd(post)} />
        <JsonLd data={postBreadcrumbJsonLd(post)} />
        <PostArticleView post={post} related={[]} />
      </>
    );
  }

  return (
    <div className="ph">
      {posts.length > 0 ? <JsonLd data={postItemListJsonLd(category, posts)} /> : null}
      <div className="ph-list-page">
        <Link href="/" className="ph-detail-back">
          ← Trang chủ
        </Link>
        <h1>{label}</h1>
        <p>Bài đã xuất bản trên An Hưng Land — chuyên mục {label.toLowerCase()}.</p>

        {posts.length === 0 ? (
          <p>Hiện chưa có bài trong chuyên mục này.</p>
        ) : (
          <div className="ph-article-row">
            {posts.map((a, idx) => (
              <Link key={a.id} href={postHref(a.category, a.slug)} className="ph-article">
                <div className="ph-article-media">
                  {a.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverImageUrl} alt={a.title} loading="lazy" />
                  ) : (
                    <span className="ph-product-media-empty">Chưa có ảnh</span>
                  )}
                </div>
                <div className="ph-article-body">
                  <span className="ph-article-idx">{String(idx + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{a.title}</h3>
                    <p className="ph-article-excerpt">{teaserExcerpt(a.excerpt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
