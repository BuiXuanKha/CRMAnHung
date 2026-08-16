import type { Metadata } from 'next';
import { ProductDetail } from '@/features/public/product-detail';
import { getProductBySlug } from '@/features/public/mock-data';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: 'Không tìm thấy sản phẩm' };
  }
  const description = `${product.title} — ${product.priceLabel} · ${product.areaLabel} · ${product.location}`;
  const url = `https://anhungland.com/san-pham/${product.slug}`;
  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.title,
      description,
      url,
      type: 'website',
      locale: 'vi_VN',
      images: [{ url: product.imageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description,
      images: [product.imageUrl],
    },
  };
}

export default function SanPhamDetailPage() {
  return <ProductDetail />;
}
