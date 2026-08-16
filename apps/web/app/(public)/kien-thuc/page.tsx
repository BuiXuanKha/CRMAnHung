import type { Metadata } from 'next';
import Link from 'next/link';
import { PUBLIC_ARTICLES } from '@/features/public/mock-data';
import '@/features/public/public-home.css';

export const metadata: Metadata = {
  title: 'Kiến thức & pháp lý',
  description: 'Kiến thức bất động sản, pháp lý và luật — An Hưng Land.',
  alternates: { canonical: 'https://anhungland.com/kien-thuc' },
};

export default function KienThucPage() {
  const posts = PUBLIC_ARTICLES.filter((a) => a.category === 'kien-thuc');
  return (
    <div className="ph">
      <div className="ph-list-page">
        <Link href="/" className="ph-detail-back">
          ← Trang chủ
        </Link>
        <h1>Kiến thức &amp; pháp lý</h1>
        <p>Thông tin phụ — giúp khách hiểu rõ hơn trước khi giao dịch.</p>
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
