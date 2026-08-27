import Link from 'next/link';
import type { PublicGuestPost } from '@crmanhung/shared';
import { ANHUNG_BRAND } from './brand';
import { sanitizeListingHtml } from './sanitize-listing-html';
import { postHref, publicPostCategoryLabel } from './published-posts';
import './public-home.css';
import './product-detail.css';

export function PostArticleView({
  post,
  related,
}: {
  post: PublicGuestPost;
  related: PublicGuestPost[];
}) {
  const bodyHtml = sanitizeListingHtml(post.bodyHtml ?? '');
  const categoryLabel = publicPostCategoryLabel(post.category);
  const publishedLabel = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="ph pd">
      <header className="ph-header is-solid">
        <div className="ph-header-inner">
          <Link href="/" className="ph-logo" aria-label={ANHUNG_BRAND.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ANHUNG_BRAND.logoOnLightSrc}
              alt={ANHUNG_BRAND.name}
              width={200}
              height={45}
            />
          </Link>
          <div className="ph-header-right">
            <a className="ph-hotline" href={`tel:${ANHUNG_BRAND.hotlineTel}`}>
              Hotline {ANHUNG_BRAND.hotlineDisplay}
            </a>
            <nav className="ph-nav" aria-label="Menu">
              <Link href={`/${post.category}`}>{categoryLabel}</Link>
              <Link href="/login" className="ph-nav-login">
                Đăng nhập
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="pd-main">
        <nav className="pd-breadcrumb" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden>/</span>
          <Link href={`/${post.category}`}>{categoryLabel}</Link>
          <span aria-hidden>/</span>
          <span>{post.title}</span>
        </nav>

        <article className="pd-primary" style={{ maxWidth: 760 }}>
          <p className="pd-posted">
            {categoryLabel}
            {publishedLabel ? (
              <>
                {' · '}
                <time dateTime={post.publishedAt!}>{publishedLabel}</time>
              </>
            ) : null}
          </p>
          <h1>{post.title}</h1>
          {post.excerpt ? <p className="pd-lead">{post.excerpt}</p> : null}

          {post.coverImageUrl ? (
            <div className="pd-gallery" style={{ marginBottom: 24 }}>
              <div className="pd-gallery-main">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.coverImageUrl} alt={post.title} />
              </div>
            </div>
          ) : null}

          {bodyHtml ? (
            <div className="pd-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          ) : null}
        </article>

        {related.length > 0 ? (
          <section className="pd-related" aria-labelledby="post-related-title">
            <div className="ph-section-head">
              <h2 id="post-related-title">Bài khác</h2>
              <Link href={`/${post.category}`} className="ph-more">
                Xem tất cả →
              </Link>
            </div>
            <div className="ph-article-row">
              {related.map((item, idx) => (
                <Link
                  key={item.id}
                  href={postHref(item.category, item.slug)}
                  className="ph-article"
                >
                  <div className="ph-article-media">
                    {item.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.coverImageUrl} alt={item.title} loading="lazy" />
                    ) : (
                      <span className="ph-product-media-empty">Chưa có ảnh</span>
                    )}
                  </div>
                  <div className="ph-article-body">
                    <span className="ph-article-idx">{String(idx + 1).padStart(2, '0')}</span>
                    <div>
                      <h3>{item.title}</h3>
                      <p className="ph-article-excerpt">{item.excerpt}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
