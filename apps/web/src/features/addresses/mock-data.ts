import { AddressKind, type AddressListItem, type AdminUnitItem } from '@crmanhung/shared';

let seq = 100;

export function nextMockId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq}`;
}

export const mockProvinces: AdminUnitItem[] = [
  { id: 'prov_bn', name: 'Bắc Ninh', parentId: null, isHidden: false },
  { id: 'prov_hn', name: 'Hà Nội', parentId: null, isHidden: false },
];

export const mockDistricts: AdminUnitItem[] = [
  { id: 'dist_yp', name: 'Yên Phong', parentId: 'prov_bn', isHidden: false },
  { id: 'dist_tu', name: 'Từ Sơn', parentId: 'prov_bn', isHidden: false },
  { id: 'dist_cg', name: 'Cầu Giấy', parentId: 'prov_hn', isHidden: false },
];

export const mockWards: AdminUnitItem[] = [
  { id: 'ward_dp', name: 'Đông Phong', parentId: 'dist_yp', isHidden: false },
  { id: 'ward_tm', name: 'Tam Giang', parentId: 'dist_yp', isHidden: false },
  { id: 'ward_dn', name: 'Đình Bảng', parentId: 'dist_tu', isHidden: false },
  { id: 'ward_yt', name: 'Yên Hòa', parentId: 'dist_cg', isHidden: false },
];

const now = '2026-08-20T10:00:00.000Z';

export const mockAddresses: AddressListItem[] = [
  {
    id: 'addr_project_vp',
    kind: AddressKind.PROJECT,
    detail: 'Khu đô thị Vạn Phúc',
    description: 'Dự án đất nền',
    provinceId: 'prov_bn',
    districtId: 'dist_yp',
    wardId: 'ward_dp',
    province: 'Bắc Ninh',
    district: 'Yên Phong',
    ward: 'Đông Phong',
    isHidden: false,
    lodatCount: 12,
    imageCount: 3,
    coverImageUrl: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'addr_regular_t5',
    kind: AddressKind.REGULAR,
    detail: 'Tổ 5',
    description: null,
    provinceId: 'prov_bn',
    districtId: 'dist_yp',
    wardId: 'ward_tm',
    province: 'Bắc Ninh',
    district: 'Yên Phong',
    ward: 'Tam Giang',
    isHidden: false,
    lodatCount: 2,
    imageCount: 0,
    coverImageUrl: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'addr_regular_empty',
    kind: AddressKind.REGULAR,
    detail: null,
    description: null,
    provinceId: 'prov_hn',
    districtId: 'dist_cg',
    wardId: 'ward_yt',
    province: 'Hà Nội',
    district: 'Cầu Giấy',
    ward: 'Yên Hòa',
    isHidden: false,
    lodatCount: 0,
    imageCount: 0,
    coverImageUrl: null,
    createdAt: now,
    updatedAt: now,
  },
];
