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

export enum TitleServiceStatus {
  DANG_LAM = 'DANG_LAM',
  TAM_DUNG = 'TAM_DUNG',
  HOAN_THANH = 'HOAN_THANH',
  HUY = 'HUY',
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

/** Cột list /lo-dat: chỉ Mở bán ↔ Tạm dừng. Đặt cọc / Đã bán thuộc giao dịch (P3). */
export const LODAT_LISTING_STATUSES = [
  LodatSaleStatus.DANG_BAN,
  LodatSaleStatus.TAM_DUNG,
] as const;
