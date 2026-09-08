export enum UserRole {
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
}

export enum CustomerStatus {
  KHACH_MOI = 'KHACH_MOI',
  KHACH_NET = 'KHACH_NET',
  KHACH_CAN_CHAM_SOC = 'KHACH_CAN_CHAM_SOC',
  KHAC = 'KHAC',
}

export enum LodatSaleStatus {
  /** Rao bán — cột Trạng thái list = Mở bán */
  DANG_BAN = 'DANG_BAN',
  /** Giao dịch (P3) — không dùng trên cột Trạng thái list */
  DAT_COC = 'DAT_COC',
  /** Giao dịch (P3) — không dùng trên cột Trạng thái list */
  DA_BAN = 'DA_BAN',
  /** Rao bán — cột Trạng thái list = Tạm dừng */
  TAM_DUNG = 'TAM_DUNG',
}

export enum LodatKind {
  NHA = 'NHA',
  DAT = 'DAT',
}

export enum AddressKind {
  REGULAR = 'REGULAR',
  PROJECT = 'PROJECT',
}

export enum TransactionType {
  OWN = 'OWN',
  RECORD = 'RECORD',
}

export enum TransactionStatus {
  DA_COC = 'DA_COC',
  DA_CONG_CHUNG = 'DA_CONG_CHUNG',
  HOAN_TAT = 'HOAN_TAT',
  HUY = 'HUY',
}

export enum TransactionPartyRole {
  SELLER = 'SELLER',
  BUYER = 'BUYER',
}

export enum TransactionAttachmentKind {
  HOP_DONG = 'HOP_DONG',
  SO_DO = 'SO_DO',
  KHAC = 'KHAC',
}

export enum TitleServiceStatus {
  DANG_LAM = 'DANG_LAM',
  TAM_DUNG = 'TAM_DUNG',
  HOAN_THANH = 'HOAN_THANH',
  HUY = 'HUY',
}

export enum TitleServiceStepType {
  BAN_GIA = 'BAN_GIA',
  THU_THAP_GIAY_TO = 'THU_THAP_GIAY_TO',
  DO_DAC = 'DO_DAC',
  NOP_HO_SO = 'NOP_HO_SO',
  BO_SUNG = 'BO_SUNG',
  LAM_VIEC_CO_QUAN = 'LAM_VIEC_CO_QUAN',
  NHAN_KET_QUA = 'NHAN_KET_QUA',
  BAN_GIAO = 'BAN_GIAO',
  /** Việc cần làm — cũng tạo khi «Thêm công việc» từ hồ sơ sổ đỏ. */
  CONG_VIEC = 'CONG_VIEC',
  KHAC = 'KHAC',
}

export enum TitleServiceDocKind {
  SO_DO = 'SO_DO',
  CAN_CUOC = 'CAN_CUOC',
  KHAC = 'KHAC',
}

export enum TitleServiceMoneyKind {
  THU = 'THU',
  CHI = 'CHI',
}

/** Bài trên web khách — `public-content.md` */
export enum PublicPostCategory {
  TIN_TUC = 'tin-tuc',
  DU_AN = 'du-an',
  KIEN_THUC = 'kien-thuc',
  KINH_NGHIEM = 'kinh-nghiem',
  LIEN_HE = 'lien-he',
  CHINH_SACH = 'chinh-sach',
}

export enum PublicPostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  [CustomerStatus.KHACH_MOI]: 'Khách mới',
  [CustomerStatus.KHACH_NET]: 'Khách nét',
  [CustomerStatus.KHACH_CAN_CHAM_SOC]: 'Khách cần chăm sóc',
  [CustomerStatus.KHAC]: 'Khác',
};

export const LODAT_SALE_STATUS_LABELS: Record<LodatSaleStatus, string> = {
  [LodatSaleStatus.DANG_BAN]: 'Mở bán',
  [LodatSaleStatus.DAT_COC]: 'Đặt cọc',
  [LodatSaleStatus.DA_BAN]: 'Đã bán',
  [LodatSaleStatus.TAM_DUNG]: 'Tạm dừng',
};

export const LODAT_KIND_LABELS: Record<LodatKind, string> = {
  [LodatKind.NHA]: 'Nhà',
  [LodatKind.DAT]: 'Đất',
};

export const ADDRESS_KIND_LABELS: Record<AddressKind, string> = {
  [AddressKind.REGULAR]: 'Đất dân',
  [AddressKind.PROJECT]: 'Dự án',
};

/** Cột list /lo-dat: chỉ Mở bán ↔ Tạm dừng. Đặt cọc / Đã bán thuộc giao dịch (P3). */
export const LODAT_LISTING_STATUSES = [
  LodatSaleStatus.DANG_BAN,
  LodatSaleStatus.TAM_DUNG,
] as const;

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.OWN]: 'Của tôi',
  [TransactionType.RECORD]: 'Ghi nhận',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  [TransactionStatus.DA_COC]: 'Đã cọc',
  [TransactionStatus.DA_CONG_CHUNG]: 'Đã công chứng',
  [TransactionStatus.HOAN_TAT]: 'Hoàn thành',
  [TransactionStatus.HUY]: 'Đã hủy',
};

export const TRANSACTION_PARTY_ROLE_LABELS: Record<TransactionPartyRole, string> = {
  [TransactionPartyRole.SELLER]: 'Người bán',
  [TransactionPartyRole.BUYER]: 'Người mua',
};

export const TRANSACTION_ATTACHMENT_KIND_LABELS: Record<TransactionAttachmentKind, string> = {
  [TransactionAttachmentKind.HOP_DONG]: 'Hợp đồng',
  [TransactionAttachmentKind.SO_DO]: 'Sổ đỏ',
  [TransactionAttachmentKind.KHAC]: 'Khác',
};

/** GD đang mở — tối đa 1 / lô (index SQL `Transaction_lodatId_open_uidx`). */
export const TRANSACTION_OPEN_STATUSES = [
  TransactionStatus.DA_COC,
  TransactionStatus.DA_CONG_CHUNG,
] as const;

export const TITLE_SERVICE_STATUS_LABELS: Record<TitleServiceStatus, string> = {
  [TitleServiceStatus.DANG_LAM]: 'Đang làm',
  [TitleServiceStatus.TAM_DUNG]: 'Tạm dừng',
  [TitleServiceStatus.HOAN_THANH]: 'Hoàn thành',
  [TitleServiceStatus.HUY]: 'Hủy',
};

export const TITLE_SERVICE_STEP_LABELS: Record<TitleServiceStepType, string> = {
  [TitleServiceStepType.BAN_GIA]: 'Bàn giá tại nhà',
  [TitleServiceStepType.THU_THAP_GIAY_TO]: 'Thu thập / scan giấy tờ',
  [TitleServiceStepType.DO_DAC]: 'Đo đạc',
  [TitleServiceStepType.NOP_HO_SO]: 'Nộp hồ sơ',
  [TitleServiceStepType.BO_SUNG]: 'Bổ sung giấy tờ',
  [TitleServiceStepType.LAM_VIEC_CO_QUAN]: 'Làm việc cơ quan',
  [TitleServiceStepType.NHAN_KET_QUA]: 'Nhận kết quả',
  [TitleServiceStepType.BAN_GIAO]: 'Bàn giao khách',
  [TitleServiceStepType.CONG_VIEC]: 'Công việc',
  [TitleServiceStepType.KHAC]: 'Khác',
};

export const TITLE_SERVICE_DOC_LABELS: Record<TitleServiceDocKind, string> = {
  [TitleServiceDocKind.SO_DO]: 'Sổ đỏ',
  [TitleServiceDocKind.CAN_CUOC]: 'CCCD',
  [TitleServiceDocKind.KHAC]: 'Giấy tờ khác',
};

export const TITLE_SERVICE_MONEY_LABELS: Record<TitleServiceMoneyKind, string> = {
  [TitleServiceMoneyKind.THU]: 'Thu',
  [TitleServiceMoneyKind.CHI]: 'Chi',
};

export const PUBLIC_POST_CATEGORY_LABELS: Record<PublicPostCategory, string> = {
  [PublicPostCategory.TIN_TUC]: 'Tin tức',
  [PublicPostCategory.DU_AN]: 'Dự án',
  [PublicPostCategory.KIEN_THUC]: 'Kiến thức',
  [PublicPostCategory.KINH_NGHIEM]: 'Kinh nghiệm',
  [PublicPostCategory.LIEN_HE]: 'Liên hệ',
  [PublicPostCategory.CHINH_SACH]: 'Chính sách bảo mật',
};

export const PUBLIC_POST_STATUS_LABELS: Record<PublicPostStatus, string> = {
  [PublicPostStatus.DRAFT]: 'Nháp',
  [PublicPostStatus.PUBLISHED]: 'Đã xuất bản',
};

/** Nguồn tạo công việc — NONE = ghi chú cá nhân; còn lại gắn đúng một đối tượng list. */
export enum TaskTargetType {
  NONE = 'NONE',
  CUSTOMER = 'CUSTOMER',
  LODAT = 'LODAT',
  TRANSACTION = 'TRANSACTION',
  TITLE_SERVICE = 'TITLE_SERVICE',
}
