import { permanentRedirect } from 'next/navigation';
import { listingHref } from '@/features/public/site';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ share?: string }>;
};

/** Legacy `/dat/{slug}` — 308 to canonical catalog (old Facebook posts). */
export const revalidate = false;

export default async function DatShortListingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { share } = await searchParams;
  permanentRedirect(listingHref(slug, share));
}
