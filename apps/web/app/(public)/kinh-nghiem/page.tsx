import type { Metadata } from 'next';
import Link from 'next/link';
import { PUBLIC_ARTICLES } from '@/features/public/mock-data';
import '@/features/public/public-home.css';

export const metadata: Metadata = {
  title: 'Kinh nghiệm mua bán',
  description: 'Kinh nghiệm mua bán, trao đổi bất động sản — An Hưng Land.',
  alternates: { canonical: 'https://anhungland.com/kinh-nghiem' },
};

export default function KinhNghiemPage() {
  const posts = PUBLIC_ARTICLES.filter((a) => a.category === 'kinh-nghiem');
  return (
    <div className="ph">
      <div className="ph-list-page">
        <Link href="/" className="ph-detail-back">
          ← Trang chủ
        </Link>
        <h1>Kinh nghiệm mua bán</h1>
        <p>Thông tin phụ — góc nhìn thực tế khi mua bán, trao đổi.</p>
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
