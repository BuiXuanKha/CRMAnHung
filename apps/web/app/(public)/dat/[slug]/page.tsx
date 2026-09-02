import { permanentRedirect } from 'next/navigation';
import { listingHref } from '@/features/public/site';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ share?: string }>;
};

/** Short share URL — 301 to the canonical catalog path (keep `?share=`). */
export const revalidate = false;

export default async function DatShortListingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { share } = await searchParams;
  permanentRedirect(listingHref(slug, share));
}
