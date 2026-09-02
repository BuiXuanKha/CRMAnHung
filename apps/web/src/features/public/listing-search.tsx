'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import {
  listingCatalogSearchPath,
  PUBLIC_LISTING_PATH,
  PUBLIC_LISTING_SEARCH_PARAM,
} from '@crmanhung/shared';

type Props = {
  defaultQuery?: string;
  inputId?: string;
};

/** Guest listing search — catalog `?q=`. Public chrome, not CRM `CrmSearchField`. */
export function PublicListingSearchForm({ defaultQuery = '', inputId = 'ph-listing-q' }: Props) {
  const router = useRouter();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = new FormData(e.currentTarget).get(PUBLIC_LISTING_SEARCH_PARAM);
    router.push(listingCatalogSearchPath(String(raw ?? '')));
  }

  return (
    <form
      className="ph-search-form"
      action={PUBLIC_LISTING_PATH}
      method="get"
      role="search"
      onSubmit={onSubmit}
    >
      <label htmlFor={inputId} className="ph-search-label">
        Tìm bài đăng
      </label>
      <div className="ph-search-row">
        <div className="ph-search-field">
          <span className="ph-search-icon" aria-hidden>
            <Search size={18} strokeWidth={2} />
          </span>
          <input
            id={inputId}
            name={PUBLIC_LISTING_SEARCH_PARAM}
            type="search"
            defaultValue={defaultQuery}
            placeholder="Nhập xã, thôn, dự án, diện tích, tiêu đề…"
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>
        <button type="submit" className="ph-search-submit">
          Tìm kiếm
        </button>
      </div>
    </form>
  );
}

export function HomeListingSearch() {
  return (
    <section className="ph-search" aria-label="Tìm bài đăng nhà đất">
      <div className="ph-search-card">
        <PublicListingSearchForm />
      </div>
    </section>
  );
}
