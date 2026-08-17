import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PROJECT_STATUS_LABEL,
  PUBLIC_ARTICLES,
  PUBLIC_PROJECTS,
} from '@/features/public/mock-data';
import '@/features/public/public-home.css';

export const metadata: Metadata = {
  title: 'Dự án',
  description: 'Dự án và cập nhật từ An Hưng Land.',
  alternates: { canonical: 'https://anhungland.com/du-an' },
};

export default function DuAnPage() {
  const posts = PUBLIC_ARTICLES.filter((a) => a.category === 'du-an');
  return (
    <div className="ph">
      <div className="ph-list-page">
        <Link href="/" className="ph-detail-back">
          ← Trang chủ
        </Link>
        <h1>Dự án</h1>
        <p>Thông tin phụ — tiến độ và dự án nổi bật.</p>
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
        <div className="ph-article-row">
          {posts.map((a, idx) => (
            <article key={a.id} className="ph-article">
              <div className="ph-article-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageUrl} alt={a.title} loading="lazy" />
              </div>
              <div className="ph-article-body">
                <span className="ph-article-idx">{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{a.title}</h3>
                  <p className="ph-article-excerpt">{a.excerpt}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
