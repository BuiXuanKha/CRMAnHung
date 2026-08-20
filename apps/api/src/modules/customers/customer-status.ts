export const CUSTOMER_STATUSES = [
  'KHACH_MOI',
  'KHACH_NET',
  'KHACH_CAN_CHAM_SOC',
  'KHAC',
] as const;

export type CustomerStatusValue = (typeof CUSTOMER_STATUSES)[number];
