import { buildListingDetailMetadata, ListingDetailRoute } from '@/features/public/listing-detail-route';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ share?: string }>;
};

export const revalidate = false;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return buildListingDetailMetadata(slug);
}

export default function DatShortListingPage(props: Props) {
  return <ListingDetailRoute {...props} />;
}
