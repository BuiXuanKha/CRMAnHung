import {
  PublicPostCategory,
  PublicPostStatus,
  type PublicWebDashboard,
  type PublicWebLotRow,
  type PublicWebPostRow,
} from '@crmanhung/shared';

export const MOCK_PUBLIC_WEB_LOTS: PublicWebLotRow[] = [
    {
      id: 'pl1',
      lodatId: 'ld1',
      slug: 'nen-tho-cu-long-thanh-mat-tien',
      title: 'Nền thổ cư Long Thành mặt tiền đường nhựa 8m',
      location: 'Long Thành, Đồng Nai',
      coverImageUrl: '/mock/lodats/p1.svg',
      isPublished: true,
      priceMode: 'AMOUNT',
      priceLabel: '2,85 tỷ',
    },
    {
      id: 'pl2',
      lodatId: 'ld2',
      slug: 'dat-vuon-cam-my-view-song',
      title: 'Đất vườn Cẩm Mỹ view sông, sổ riêng',
      location: 'Cẩm Mỹ, Đồng Nai',
      coverImageUrl: '/mock/lodats/p2.svg',
      isPublished: true,
      priceMode: 'AMOUNT',
      priceLabel: '1,65 tỷ',
    },
    {
      id: 'pl3',
      lodatId: 'ld3',
      slug: 'nha-pho-bien-hoa-2-tang',
      title: 'Nhà phố Biên Hòa 2 tầng gần trung tâm',
      location: 'Biên Hòa, Đồng Nai',
      coverImageUrl: '/mock/lodats/p3.svg',
      isPublished: true,
      priceMode: 'CONTACT',
      priceLabel: null,
    },
    {
      id: 'pl4',
      lodatId: 'ld4',
      slug: 'lo-goc-nhon-trach-khu-dan-cu',
      title: 'Lô góc Nhơn Trạch trong khu dân cư hiện hữu',
      location: 'Nhơn Trạch, Đồng Nai',
      coverImageUrl: null,
      isPublished: false,
      priceMode: 'AMOUNT',
      priceLabel: '3,1 tỷ',
    },
    {
      id: 'pl5',
      lodatId: 'ld5',
      slug: 'lk12-kdt-tay-nam-sach',
      title: 'LK12 KĐT Tây Nam Sách',
      location: 'BT6.8 KĐT Tây Nam Sách',
      coverImageUrl: '/mock/lodats/p4.svg',
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
    },
    {
      id: 'pp2',
      slug: 'tien-do-du-an-long-thanh',
      title: 'Tiến độ hạ tầng Long Thành quý 3',
      category: PublicPostCategory.DU_AN,
      status: PublicPostStatus.PUBLISHED,
    },
    {
      id: 'pp3',
      slug: 'thu-tuc-sang-ten-so-hong',
      title: 'Thủ tục sang tên sổ hồng cần giấy tờ gì',
      category: PublicPostCategory.KIEN_THUC,
      status: PublicPostStatus.PUBLISHED,
    },
    {
      id: 'pp4',
      slug: 'kinh-nghiem-xem-dat-cuoi-tuan',
      title: 'Kinh nghiệm xem đất cuối tuần',
      category: PublicPostCategory.KINH_NGHIEM,
      status: PublicPostStatus.DRAFT,
    },
    {
      id: 'pp5',
      slug: 'tin-mo-ban-dot-2',
      title: 'Nháp: mở bán đợt 2 — chưa xuất bản',
      category: PublicPostCategory.TIN_TUC,
      status: PublicPostStatus.DRAFT,
    },
    {
      id: 'pp6',
      slug: 'lien-he',
      title: 'Liên hệ An Hưng Land',
      category: PublicPostCategory.LIEN_HE,
      status: PublicPostStatus.PUBLISHED,
    },
    {
      id: 'pp7',
      slug: 'chinh-sach-bao-mat',
      title: 'Chính sách bảo mật',
      category: PublicPostCategory.CHINH_SACH,
      status: PublicPostStatus.PUBLISHED,
    },
];

export function buildPublicWebDashboard(
  lots: PublicWebLotRow[],
  posts: PublicWebPostRow[],
): PublicWebDashboard {
  return {
    publishedLotCount: lots.filter((row) => row.isPublished).length,
    pendingLotCount: lots.filter((row) => !row.isPublished).length,
    publishedPostCount: posts.filter((row) => row.status === PublicPostStatus.PUBLISHED).length,
    draftPostCount: posts.filter((row) => row.status === PublicPostStatus.DRAFT).length,
    recentLots: lots.slice(0, 8),
    recentPosts: posts.slice(0, 8),
  };
}
