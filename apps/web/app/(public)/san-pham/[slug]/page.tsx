import type { Metadata } from 'next';
import { ProductDetailView } from '@/features/public/product-detail';
import { getProductBySlug, PUBLIC_PRODUCTS } from '@/features/public/mock-data';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PUBLIC_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: 'Không tìm thấy sản phẩm' };
  }
  const description =
    product.description.slice(0, 155) ||
    `${product.title} — ${product.priceLabel} · ${product.areaLabel} · ${product.location}`;
  const url = `https://anhungland.com/san-pham/${product.slug}`;
  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${product.title} | An Hưng Land`,
      description,
      url,
      type: 'website',
      locale: 'vi_VN',
      siteName: 'An Hưng Land',
      images: [{ url: product.imageUrl, alt: product.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description,
      images: [product.imageUrl],
    },
  };
}

export default async function SanPhamDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailView slug={slug} />;
}
