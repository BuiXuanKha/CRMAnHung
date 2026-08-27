import {
  LodatKind,
  LodatSaleStatus,
  PublicPostCategory,
  PublicPostStatus,
  listingBodyToExcerpt,
  type LodatListItem,
  type PublicWebDashboard,
  type PublicWebLotRow,
  type PublicWebPostRow,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { toListingPublicSlug } from './display';
import { plainTextToListingBodyHtml, suggestPublicExcerpt, suggestPublicPrice } from './listing-copy';

export const MOCK_PUBLIC_WEB_LOTS: PublicWebLotRow[] = [
  {
    id: 'pl1',
    lodatId: 'ld_lk5_37',
    slug: 'lk5-37-mat-song',
    title: 'LK5 - 37 Mặt sông',
    location: 'Khu Đô Thị Đồng Khê - Hồng Phong',
    coverImageUrl: '/mock/lodats/p1.svg',
    isPublished: true,
    priceMode: 'AMOUNT',
    priceLabel: '2 tỷ xxx',
  },
  {
    id: 'pl2',
    lodatId: 'ld_lk3_12',
    slug: 'lk3-12-duong-20m',
    title: 'LK3 - 12 Đường 20m',
    location: 'Khu Đô Thị An Hưng - An Đồng',
    coverImageUrl: '/mock/lodats/p2.svg',
    isPublished: true,
    priceMode: 'AMOUNT',
    priceLabel: '3 tỷ xxx',
  },
  {
    id: 'pl3',
    lodatId: 'ld_bt08',
    slug: 'bt-08-biet-thu-vuon',
    title: 'BT-08 Biệt thự vườn',
    location: 'Khu Đô Thị Đồng Khê - Hồng Phong',
    coverImageUrl: '/mock/lodats/p3.svg',
    isPublished: true,
    priceMode: 'CONTACT',
    priceLabel: null,
  },
  {
    id: 'pl4',
    lodatId: 'ld_a15',
    slug: 'nen-a-15-quan-tao-dong',
    title: 'Nền A-15 Quán Táo Đông',
    location: 'Quán Táo Đông - An Đồng',
    coverImageUrl: '/mock/lodats/p4.svg',
    isPublished: false,
    priceMode: 'AMOUNT',
    priceLabel: '1 tỷ xxx',
  },
  {
    id: 'pl5',
    lodatId: 'ld_lk4_18',
    slug: 'lk4-18-view-ho',
    title: 'LK4 - 18 View hồ',
    location: 'Khu Đô Thị Đồng Khê - Hồng Phong',
    coverImageUrl: '/mock/lodats/p3.svg',
    isPublished: false,
    priceMode: 'CONTACT',
    priceLabel: null,
  },
];

export const MOCK_PUBLIC_WEB_POSTS: PublicWebPostRow[] = [
  {
    id: 'pp1',
    slug: 'bang-gia-kdt-tay-nam-sach-thang-8',
    title: 'Bảng giá KĐT Tây Nam Sách tháng 8',
    category: PublicPostCategory.TIN_TUC,
    status: PublicPostStatus.PUBLISHED,
    coverImageUrl: '/mock/lodats/p1.svg',
    bodyHtml:
      '<p>Cập nhật bảng giá tháng 8 tại KĐT Tây Nam Sách.</p><p>Liên hệ hotline công ty để nhận bảng chi tiết.</p>',
  },
  {
    id: 'pp2',
    slug: 'tien-do-du-an-long-thanh',
    title: 'Tiến độ hạ tầng Long Thành quý 3',
    category: PublicPostCategory.DU_AN,
    status: PublicPostStatus.PUBLISHED,
    coverImageUrl: '/mock/lodats/p2.svg',
    bodyHtml: '<p>Tiến độ đường giao thông và hạ tầng kỹ thuật quý 3.</p>',
  },
  {
    id: 'pp3',
    slug: 'thu-tuc-sang-ten-so-hong',
    title: 'Thủ tục sang tên sổ hồng cần giấy tờ gì',
    category: PublicPostCategory.KIEN_THUC,
    status: PublicPostStatus.PUBLISHED,
    coverImageUrl: '/mock/lodats/p3.svg',
    bodyHtml: '<p>Danh mục giấy tờ cơ bản khi sang tên sổ hồng.</p>',
  },
  {
    id: 'pp4',
    slug: 'kinh-nghiem-xem-dat-cuoi-tuan',
    title: 'Kinh nghiệm xem đất cuối tuần',
    category: PublicPostCategory.KINH_NGHIEM,
    status: PublicPostStatus.DRAFT,
    coverImageUrl: null,
    bodyHtml: '<p>Nháp: checklist khi đi xem đất cuối tuần.</p>',
  },
  {
    id: 'pp5',
    slug: 'tin-mo-ban-dot-2',
    title: 'Nháp: mở bán đợt 2 — chưa xuất bản',
    category: PublicPostCategory.TIN_TUC,
    status: PublicPostStatus.DRAFT,
    coverImageUrl: null,
    bodyHtml: '',
  },
  {
    id: 'pp6',
    slug: 'lien-he',
    title: 'Liên hệ An Hưng Land',
    category: PublicPostCategory.LIEN_HE,
    status: PublicPostStatus.PUBLISHED,
    coverImageUrl: '/mock/lodats/p4.svg',
    bodyHtml: '<p>Hotline 0977.656.280 · BT6.8 KĐT Tây Nam Sách.</p>',
  },
  {
    id: 'pp7',
    slug: 'chinh-sach-bao-mat',
    title: 'Chính sách bảo mật',
    category: PublicPostCategory.CHINH_SACH,
    status: PublicPostStatus.PUBLISHED,
    coverImageUrl: '/mock/lodats/p1.svg',
    bodyHtml: '<p>Cam kết bảo mật thông tin khách hàng trên website.</p>',
  },
];

const STAFF_BY_LODAT: Record<string, string> = {
  ld_lk5_37: 'Bùi Xuân Khả',
  ld_lk3_12: 'Bùi Nam',
  ld_bt08: 'Bùi Xuân Khả',
  ld_a15: 'Bùi Nam',
  ld_no_photo: 'Bùi Xuân Khả',
  ld_no_price: 'Bùi Nam',
  ld_no_specs: 'Bùi Xuân Khả',
  ld_no_addr: 'Bùi Nam',
  ld_lk4_18: 'Bùi Xuân Khả',
  ld_lk6_02: 'Bùi Nam',
  ld_c22: 'Bùi Xuân Khả',
  ld_lk9_41: 'Bùi Nam',
};

export function buildStaffOpenLots(
  plots: LodatListItem[],
  listings: PublicWebLotRow[],
): PublicWebStaffLotRow[] {
  return plots
    .filter((plot) => plot.status === LodatSaleStatus.DANG_BAN)
    .map((plot) => {
      const listing = listings.find((row) => row.lodatId === plot.id);
      const suggested = suggestPublicPrice(plot.priceVnd);
      const priceMode = listing?.priceMode ?? suggested.priceMode;
      const priceLabel =
        priceMode === 'AMOUNT' ? (listing?.priceLabel ?? suggested.priceLabel) : null;
      const staffName =
        plot.createdByEmployeeName?.trim() || STAFF_BY_LODAT[plot.id] || '—';
      const title = listing?.title ?? plot.title;
      const location = listing?.location ?? plot.address ?? '';
      const kind = plot.kind ?? LodatKind.DAT;
      const areaM2 = plot.areaM2 ?? null;
      const frontageM = plot.frontageM ?? null;
      const direction = plot.direction ?? null;
      const suggestedExcerpt = suggestPublicExcerpt({
        title,
        location,
        kind,
        areaM2,
        frontageM,
        direction,
      });
      const bodyHtml =
        listing?.bodyHtml?.trim() ||
        plainTextToListingBodyHtml(listing?.excerpt?.trim() || suggestedExcerpt);
      const excerpt =
        listing?.excerpt?.trim() ||
        listingBodyToExcerpt(bodyHtml) ||
        suggestedExcerpt;
      return {
        id: listing?.id ?? `pending-${plot.id}`,
        lodatId: plot.id,
        slug: listing?.slug ?? toListingPublicSlug(title, location),
        title,
        location,
        coverImageUrl: listing?.coverImageUrl ?? plot.coverImageUrl ?? null,
        isPublished: listing?.isPublished ?? false,
        priceMode,
        priceLabel,
        excerpt,
        bodyHtml,
        staffName,
        kind,
        areaM2,
        frontageM,
        direction,
        priceVnd: plot.priceVnd ?? null,
      };
    });
}

export function listingFromStaffLot(row: PublicWebStaffLotRow): PublicWebLotRow {
  return {
    id: row.id.startsWith('pending-') ? `pl-${row.lodatId}` : row.id,
    lodatId: row.lodatId,
    slug: row.slug,
    title: row.title,
    location: row.location,
    coverImageUrl: row.coverImageUrl,
    isPublished: row.isPublished,
    priceMode: row.priceMode,
    priceLabel: row.priceLabel,
    excerpt: row.excerpt,
    bodyHtml: row.bodyHtml,
  };
}

export function buildPublicWebDashboard(
  lots: PublicWebLotRow[],
  posts: PublicWebPostRow[],
  staffOpen: PublicWebStaffLotRow[],
): PublicWebDashboard {
  return {
    publishedLotCount: staffOpen.filter((row) => row.isPublished).length,
    pendingLotCount: staffOpen.filter((row) => !row.isPublished).length,
    publishedPostCount: posts.filter((row) => row.status === PublicPostStatus.PUBLISHED).length,
    draftPostCount: posts.filter((row) => row.status === PublicPostStatus.DRAFT).length,
    recentLots: lots.slice(0, 8),
    recentPosts: posts.slice(0, 8),
  };
}
