import { Suspense } from 'react';
import { TitleServiceListPage } from '@/features/title-services/title-service-list-page';

export default function DichVuSoDoPage() {
  return (
    <Suspense fallback={null}>
      <TitleServiceListPage />
    </Suspense>
  );
}
