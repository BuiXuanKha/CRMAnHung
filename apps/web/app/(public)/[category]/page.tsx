import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicPostCategory } from '@crmanhung/shared';
import {
  PROJECT_STATUS_LABEL,
  PUBLIC_PROJECTS,
} from '@/features/public/mock-data';
import {
  isPublicPostCategory,
  listPublicGuestPosts,
  postHref,
  publicPostCategoryLabel,
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
  return categoryListMetadata(category);
}

export default async function PublicCategoryListPage({ params }: Props) {
  const { category } = await params;
  if (!isPublicPostCategory(category)) notFound();

  const posts = await listPublicGuestPosts(category);
  const label = publicPostCategoryLabel(category);
  const showProjects = category === PublicPostCategory.DU_AN;

  return (
    <div className="ph">
      {posts.length > 0 ? <JsonLd data={postItemListJsonLd(category, posts)} /> : null}
      <div className="ph-list-page">
        <Link href="/" className="ph-detail-back">
          ← Trang chủ
        </Link>
        <h1>{label}</h1>
        <p>Bài đã xuất bản trên An Hưng Land — chuyên mục {label.toLowerCase()}.</p>

        {showProjects ? (
          <div className="ph-project-row" style={{ marginBottom: 40 }}>
            {PUBLIC_PROJECTS.map((pj) => (
              <div key={pj.id} className="ph-project">
                <div className="ph-project-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pj.imageUrl} alt={pj.title} loading="lazy" />
                </div>
                <div className="ph-project-body">
                  <span
                    className={
                      pj.status === 'DANG_MO_BAN'
                        ? 'ph-badge ph-badge-open'
                        : 'ph-badge ph-badge-soon'
                    }
                  >
                    {PROJECT_STATUS_LABEL[pj.status]}
                  </span>
                  <h3>{pj.title}</h3>
                  <p>
                    {pj.areaLabel} · {pj.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

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
                    <p className="ph-article-excerpt">{a.excerpt}</p>
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
