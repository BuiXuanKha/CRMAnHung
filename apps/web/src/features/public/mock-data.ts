export type PublicProduct = {
  id: string;
  slug: string;
  title: string;
  priceLabel: string;
  areaLabel: string;
  location: string;
  imageUrl: string;
  postedLabel: string;
  /** Chi tiết trang khách */
  typeLabel: string;
  legalLabel: string;
  directionLabel: string;
  frontageLabel: string;
  description: string;
  highlights: string[];
  gallery: string[];
};

export type PublicProject = {
  id: string;
  slug: string;
  title: string;
  status: 'DANG_MO_BAN' | 'SAP_MO_BAN';
  areaLabel: string;
  location: string;
  imageUrl: string;
  photoCount: number;
};

export type PublicArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: 'du-an' | 'kien-thuc' | 'kinh-nghiem';
  imageUrl: string;
  publishedLabel: string;
};

const GALLERY = {
  house: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80',
  ],
  land: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1628624747186-a941c476b7ef?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1464082354059-27db6ce50048?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
  ],
  villa: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1400&q=80',
  ],
} as const;

export const PUBLIC_PRODUCTS: PublicProduct[] = [
  {
    id: 'p1',
    slug: 'nen-tho-cu-long-thanh-mat-tien',
    title: 'Nền thổ cư Long Thành mặt tiền đường nhựa 8m',
    priceLabel: '2,85 tỷ',
    areaLabel: '120 m²',
    location: 'Long Thành, Đồng Nai',
    imageUrl: GALLERY.land[0],
    postedLabel: 'Đăng hôm nay',
    typeLabel: 'Đất nền thổ cư',
    legalLabel: 'Sổ hồng riêng',
    directionLabel: 'Đông Nam',
    frontageLabel: '6 m',
    description:
      'Nền thổ cư mặt tiền đường nhựa 8m, khu dân cư hiện hữu, đường thông thoáng. Phù hợp xây nhà ở hoặc đầu tư giữ tài sản. An Hưng Land hỗ trợ xem đất thực tế và tư vấn thủ tục miễn phí.',
    highlights: [
      'Mặt tiền đường nhựa 8m',
      'Khu dân cư hiện hữu',
      'Gần tiện ích trường học, chợ',
      'Hỗ trợ đo đạc / sổ hồng',
    ],
    gallery: [...GALLERY.land],
  },
  {
    id: 'p2',
    slug: 'dat-vuon-cam-my-view-song',
    title: 'Đất vườn Cẩm Mỹ view sông, sổ riêng',
    priceLabel: '1,65 tỷ',
    areaLabel: '520 m²',
    location: 'Cẩm Mỹ, Đồng Nai',
    imageUrl: GALLERY.land[1],
    postedLabel: 'Đăng 1 ngày trước',
    typeLabel: 'Đất vườn',
    legalLabel: 'Sổ riêng',
    directionLabel: 'Tây Bắc',
    frontageLabel: '12 m',
    description:
      'Lô đất vườn rộng, view sông thoáng mát, phù hợp làm nhà vườn hoặc nghỉ dưỡng cuối tuần. Pháp lý sổ riêng rõ ràng, đường vào xe ô tô.',
    highlights: ['View sông', 'Đường xe ô tô', 'Diện tích lớn 520 m²', 'Giá mềm so khu vực'],
    gallery: [GALLERY.land[1], GALLERY.land[0], GALLERY.land[2], GALLERY.land[3]],
  },
  {
    id: 'p3',
    slug: 'nha-pho-bien-hoa-2-tang',
    title: 'Nhà phố Biên Hòa 2 tầng gần trung tâm',
    priceLabel: '4,2 tỷ',
    areaLabel: '96 m²',
    location: 'Biên Hòa, Đồng Nai',
    imageUrl: GALLERY.house[3],
    postedLabel: 'Đăng 2 ngày trước',
    typeLabel: 'Nhà phố',
    legalLabel: 'Sổ hồng',
    directionLabel: 'Nam',
    frontageLabel: '5 m',
    description:
      'Nhà phố 2 tầng hoàn thiện, gần trung tâm Biên Hòa, thuận tiện đi lại và kinh doanh nhỏ. Nội thất cơ bản, vào ở ngay.',
    highlights: ['2 tầng hoàn thiện', 'Gần trung tâm', 'Vào ở ngay', 'Hẻm xe hơi'],
    gallery: [...GALLERY.house],
  },
  {
    id: 'p4',
    slug: 'lo-goc-nhon-trach-khu-dan-cu',
    title: 'Lô góc Nhơn Trạch trong khu dân cư hiện hữu',
    priceLabel: '3,1 tỷ',
    areaLabel: '100 m²',
    location: 'Nhơn Trạch, Đồng Nai',
    imageUrl: GALLERY.house[1],
    postedLabel: 'Đăng 3 ngày trước',
    typeLabel: 'Đất nền',
    legalLabel: 'Sổ hồng',
    directionLabel: 'Đông Bắc',
    frontageLabel: 'Lô góc 2 mặt',
    description:
      'Lô góc 2 mặt tiền trong khu dân cư hiện hữu Nhơn Trạch — vị trí đẹp để xây nhà ở hoặc mở quán nhỏ. Hạ tầng điện nước đầy đủ.',
    highlights: ['Lô góc 2 mặt', 'Khu dân cư hiện hữu', 'Hạ tầng đầy đủ', 'Tiềm năng kinh doanh'],
    gallery: [GALLERY.house[1], GALLERY.land[0], GALLERY.house[0], GALLERY.land[2]],
  },
  {
    id: 'p5',
    slug: 'dat-nen-trang-bom-gia-tot',
    title: 'Đất nền Trảng Bom giá tốt, pháp lý rõ',
    priceLabel: '980 triệu',
    areaLabel: '85 m²',
    location: 'Trảng Bom, Đồng Nai',
    imageUrl: GALLERY.land[1],
    postedLabel: 'Đăng 4 ngày trước',
    typeLabel: 'Đất nền',
    legalLabel: 'Sổ riêng',
    directionLabel: 'Tây',
    frontageLabel: '5 m',
    description:
      'Nền giá tốt tại Trảng Bom, phù hợp khách mua lần đầu hoặc đầu tư dài hạn. Pháp lý rõ, hỗ trợ xem đất và tư vấn vay nếu cần.',
    highlights: ['Giá dưới 1 tỷ', 'Pháp lý rõ', 'Phù hợp mua lần đầu', 'Hỗ trợ xem đất'],
    gallery: [GALLERY.land[1], GALLERY.land[2], GALLERY.land[0], GALLERY.land[3]],
  },
  {
    id: 'p6',
    slug: 'biet-thu-vuon-xuan-loc',
    title: 'Biệt thự vườn Xuân Lộc — không gian xanh',
    priceLabel: '6,5 tỷ',
    areaLabel: '350 m²',
    location: 'Xuân Lộc, Đồng Nai',
    imageUrl: GALLERY.villa[0],
    postedLabel: 'Đăng 5 ngày trước',
    typeLabel: 'Biệt thự vườn',
    legalLabel: 'Sổ hồng',
    directionLabel: 'Đông',
    frontageLabel: '10 m',
    description:
      'Biệt thự vườn không gian xanh yên tĩnh tại Xuân Lộc. Sân vườn rộng, phù hợp gia đình muốn ở thoáng hoặc nghỉ dưỡng.',
    highlights: ['Sân vườn rộng', 'Không gian xanh', 'Nhà hoàn thiện', 'Yên tĩnh'],
    gallery: [...GALLERY.villa],
  },
  {
    id: 'p7',
    slug: 'dat-cong-nghiep-gan-cao-toc',
    title: 'Đất gần cao tốc Long Thành — tiềm năng thương mại',
    priceLabel: '12 tỷ',
    areaLabel: '1.000 m²',
    location: 'Long Thành, Đồng Nai',
    imageUrl: GALLERY.land[3],
    postedLabel: 'Đăng tuần trước',
    typeLabel: 'Đất thương mại',
    legalLabel: 'Sổ đỏ',
    directionLabel: 'Nam',
    frontageLabel: '20 m',
    description:
      'Lô đất lớn gần cao tốc Long Thành, phù hợp kho xưởng nhỏ, showroom hoặc đầu tư chờ hạ tầng. Liên hệ An Hưng Land để xem vị trí thực tế.',
    highlights: ['Gần cao tốc', 'Diện tích 1.000 m²', 'Mặt tiền rộng', 'Tiềm năng thương mại'],
    gallery: [GALLERY.land[3], GALLERY.land[0], GALLERY.land[2], GALLERY.house[1]],
  },
  {
    id: 'p8',
    slug: 'nen-du-an-noi-bo-an-ninh',
    title: 'Nền trong khu dân cư nội bộ, an ninh tốt',
    priceLabel: '1,9 tỷ',
    areaLabel: '90 m²',
    location: 'Biên Hòa, Đồng Nai',
    imageUrl: GALLERY.house[2],
    postedLabel: 'Đăng tuần trước',
    typeLabel: 'Đất nền dự án',
    legalLabel: 'Sổ hồng',
    directionLabel: 'Đông Nam',
    frontageLabel: '5 m',
    description:
      'Nền trong khu dân cư nội bộ có cổng bảo vệ, đường nội bộ sạch đẹp. Phù hợp gia đình trẻ xây nhà ở lâu dài.',
    highlights: ['Khu nội bộ an ninh', 'Đường nội bộ đẹp', 'Gần tiện ích', 'Pháp lý sổ hồng'],
    gallery: [GALLERY.house[2], GALLERY.house[0], GALLERY.house[1], GALLERY.land[0]],
  },
];

export const PUBLIC_PROJECTS: PublicProject[] = [
  {
    id: 'pj1',
    slug: 'khu-dan-cu-an-hung-long-thanh',
    title: 'Khu dân cư An Hưng Long Thành',
    status: 'DANG_MO_BAN',
    areaLabel: '12 ha',
    location: 'Long Thành, Đồng Nai',
    imageUrl:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80',
    photoCount: 12,
  },
  {
    id: 'pj2',
    slug: 'khu-do-thi-ven-song-cam-my',
    title: 'Khu đô thị ven sông Cẩm Mỹ',
    status: 'SAP_MO_BAN',
    areaLabel: '8,5 ha',
    location: 'Cẩm Mỹ, Đồng Nai',
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
    photoCount: 7,
  },
  {
    id: 'pj3',
    slug: 'nha-pho-thuong-mai-bien-hoa',
    title: 'Nhà phố thương mại Biên Hòa',
    status: 'DANG_MO_BAN',
    areaLabel: '3,2 ha',
    location: 'Biên Hòa, Đồng Nai',
    imageUrl:
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80',
    photoCount: 9,
  },
];

export const PUBLIC_ARTICLES: PublicArticle[] = [
  {
    id: 'a1',
    slug: 'cap-nhat-tien-do-du-an-long-thanh',
    title: 'Cập nhật tiến độ hạ tầng khu dân cư Long Thành tháng 8',
    excerpt: 'Đường nội bộ hoàn thiện 70%, điện nước về từng nền.',
    category: 'du-an',
    imageUrl:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    publishedLabel: '3 ngày trước',
  },
  {
    id: 'a2',
    slug: 'so-hong-va-dat-tho-cu-can-biet',
    title: 'Sổ hồng và đất thổ cư: những điều cần kiểm tra trước khi mua',
    excerpt: 'Pháp lý rõ ràng giúp tránh rủi ro tranh chấp sau giao dịch.',
    category: 'kien-thuc',
    imageUrl:
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80',
    publishedLabel: '1 tuần trước',
  },
  {
    id: 'a3',
    slug: 'kinh-nghiem-dam-phan-gia-dat-nen',
    title: 'Kinh nghiệm đàm phán giá khi mua đất nền vùng ven',
    excerpt: 'Chuẩn bị thông tin khu vực và giữ thế chủ động khi thương lượng.',
    category: 'kinh-nghiem',
    imageUrl:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    publishedLabel: '2 tuần trước',
  },
];

export const PROJECT_STATUS_LABEL: Record<PublicProject['status'], string> = {
  DANG_MO_BAN: 'Đang mở bán',
  SAP_MO_BAN: 'Sắp mở bán',
};

export const ARTICLE_CATEGORY_LABEL: Record<PublicArticle['category'], string> = {
  'du-an': 'Dự án',
  'kien-thuc': 'Kiến thức & pháp lý',
  'kinh-nghiem': 'Kinh nghiệm',
};

export function getProductBySlug(slug: string) {
  return PUBLIC_PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(slug: string, limit = 3) {
  return PUBLIC_PRODUCTS.filter((p) => p.slug !== slug).slice(0, limit);
}
