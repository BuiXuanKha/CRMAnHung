import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicPostCategory } from '@crmanhung/shared';
import {
  isPublicPostCategory,
  listPublicGuestPosts,
  postHref,
  publicPostCategoryLabel,
  teaserExcerpt,
} from '@/features/public/published-posts';
import { JsonLd } from '@/features/public/json-ld';
import { categoryListMetadata, postItemListJsonLd } from '@/features/public/post-seo';
import '@/features/public/public-home.css';

type Props = { params: Promise<{ category: string }> };

export const revalidate = false;

export function generateStaticParams() {
  return Object.values(PublicPostCategory).map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isPublicPostCategory(category)) {
    return { title: 'Không tìm thấy', robots: { index: false, follow: false } };
  }
  const posts = await listPublicGuestPosts(category);
  return categoryListMetadata(category, { postCount: posts.length });
}

export default async function PublicCategoryListPage({ params }: Props) {
  const { category } = await params;
  if (!isPublicPostCategory(category)) notFound();

  const posts = await listPublicGuestPosts(category);
  const label = publicPostCategoryLabel(category);

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
