import type { Metadata } from 'next';
import {
  clipMetaDescription,
  listingSearchDescription,
  type PublicGuestPost,
} from '@crmanhung/shared';
import { ANHUNG_BRAND } from './brand';
import { publicPostCategoryLabel } from './published-posts';
import {
  PUBLIC_OG_DEFAULT,
  PUBLIC_SITE_ORIGIN,
  toAbsoluteUrl,
} from './site';

export function postCanonicalUrl(category: string, slug: string): string {
  return `${PUBLIC_SITE_ORIGIN}/${category}/${slug}`;
}

export function categoryListCanonicalUrl(category: string): string {
  return `${PUBLIC_SITE_ORIGIN}/${category}`;
}

export function unpublishedPostMetadata(): Metadata {
  return {
    title: 'Không tìm thấy bài viết',
    description: 'Bài viết không tồn tại hoặc chưa được xuất bản.',
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export function postMetadata(post: PublicGuestPost): Metadata {
  const description = listingSearchDescription({
    metaDescription: post.metaDescription,
    excerpt: post.excerpt,
  });
  const url = postCanonicalUrl(post.category, post.slug);
  const imageSrc = post.coverImageUrl?.trim() || PUBLIC_OG_DEFAULT;
  const image = { url: toAbsoluteUrl(imageSrc), alt: post.title };
  const branded = `${post.title} | ${ANHUNG_BRAND.name}`;
  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: branded,
      description,
      url,
      type: 'article',
      locale: 'vi_VN',
      siteName: ANHUNG_BRAND.name,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: branded,
      description,
      images: [image.url],
    },
  };
}

export function categoryListMetadata(category: string): Metadata {
  const label = publicPostCategoryLabel(category);
  const url = categoryListCanonicalUrl(category);
  const description = clipMetaDescription(
    `Bài viết chuyên mục ${label} từ An Hưng Land — tin tức, kiến thức và cập nhật dự án.`,
  );
  return {
    title: label,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${label} | ${ANHUNG_BRAND.name}`,
      description,
      url,
      type: 'website',
      locale: 'vi_VN',
      siteName: ANHUNG_BRAND.name,
      images: [{ url: toAbsoluteUrl(PUBLIC_OG_DEFAULT), alt: ANHUNG_BRAND.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${label} | ${ANHUNG_BRAND.name}`,
      description,
      images: [toAbsoluteUrl(PUBLIC_OG_DEFAULT)],
    },
  };
}

export function postArticleJsonLd(post: PublicGuestPost) {
  const url = postCanonicalUrl(post.category, post.slug);
  const description = listingSearchDescription({
    metaDescription: post.metaDescription,
    excerpt: post.excerpt,
  });
  const image = toAbsoluteUrl(post.coverImageUrl?.trim() || PUBLIC_OG_DEFAULT);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description,
    url,
    image,
    inLanguage: 'vi-VN',
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
    author: {
      '@type': 'Organization',
      name: post.authorLabel?.trim() || ANHUNG_BRAND.name,
    },
    publisher: {
      '@type': 'Organization',
      name: ANHUNG_BRAND.name,
      url: PUBLIC_SITE_ORIGIN,
    },
    articleSection: publicPostCategoryLabel(post.category),
  };
}

export function postBreadcrumbJsonLd(post: PublicGuestPost) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: PUBLIC_SITE_ORIGIN },
      {
        '@type': 'ListItem',
        position: 2,
        name: publicPostCategoryLabel(post.category),
        item: categoryListCanonicalUrl(post.category),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: postCanonicalUrl(post.category, post.slug),
      },
    ],
  };
}
