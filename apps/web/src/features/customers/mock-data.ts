import {
  CustomerStatus,
  UserRole,
  type AuthUser,
  type CustomerDetail,
} from '@crmanhung/shared';

export const MOCK_STAFF: AuthUser = {
  id: 'user_staff_1',
  username: 'staff',
  fullName: 'Bùi Xuân Khả',
  role: UserRole.STAFF,
};

export const MOCK_ADMIN: AuthUser = {
  id: 'user_admin_1',
  username: 'admin',
  fullName: 'Admin Demo',
  role: UserRole.ADMIN,
};

const OTHER_EMPLOYEE_ID = 'user_staff_other';

function staffCustomer(
  partial: Omit<CustomerDetail, 'employeeId' | 'employeeName'> &
    Partial<Pick<CustomerDetail, 'employeeId' | 'employeeName'>>,
): CustomerDetail {
  return {
    employeeId: MOCK_STAFF.id,
    employeeName: MOCK_STAFF.fullName,
    ...partial,
  };
}

/** Domain §8 + vài dòng để bảng trông giống ảnh mẫu. */
export const mockCustomers: CustomerDetail[] = [
  staffCustomer({
    id: 'cus_net_phones',
    fullName: 'Trần Thị Bích',
    status: CustomerStatus.KHACH_NET,
    budgetMinVnd: 1_500_000_000,
    budgetMaxVnd: 2_000_000_000,
    note: 'Hỏi lô 38 Quán Táo Đông',
    isPinned: true,
    isHidden: false,
    primaryPhone: '0912345678',
    phones: [
      { id: 'ph2', phone: '0912345678', label: 'Chính' },
      { id: 'ph3', phone: '0987654321', label: 'Phụ' },
    ],
    facebook: null,
    latestCareNote: 'Hẹn xem đất cuối tuần',
    lodatCount: 2,
    createdAt: '2026-06-15T08:00:00.000Z',
    updatedAt: '2026-08-16T15:30:00.000Z',
    careNotes: [
      {
        id: 'care2',
        note: 'Hẹn xem đất cuối tuần',
        employeeId: MOCK_STAFF.id,
        employeeName: MOCK_STAFF.fullName,
        createdAt: '2026-08-16T15:30:00.000Z',
      },
    ],
  }),
  staffCustomer({
    id: 'cus_moi_fb',
    fullName: 'Nguyễn Văn An',
    status: CustomerStatus.KHACH_MOI,
    budgetMinVnd: null,
    budgetMaxVnd: null,
    note: 'Inbox hỏi lô mặt tiền',
    isPinned: true,
    isHidden: false,
    primaryPhone: '0901234567',
    phones: [{ id: 'ph1', phone: '0901234567', label: 'Zalo Khả' }],
    facebook: {
      customerUid: 'fb_1001',
      threadId: 'thread_1001',
      facebookName: 'Nguyen Van An FB',
      avatarUrl: null,
      scanSource: 'business_suite',
    },
    latestCareNote: 'Vừa inbox hỏi lô mặt tiền',
    lodatCount: 0,
    createdAt: '2026-07-01T08:00:00.000Z',
    updatedAt: '2026-08-16T10:00:00.000Z',
    careNotes: [
      {
        id: 'care1',
        note: 'Vừa inbox hỏi lô mặt tiền',
        employeeId: MOCK_STAFF.id,
        employeeName: MOCK_STAFF.fullName,
        createdAt: '2026-08-16T10:00:00.000Z',
      },
    ],
  }),
  staffCustomer({
    id: 'cus_pin_3',
    fullName: 'Lê Hoàng Nam',
    status: CustomerStatus.KHACH_NET,
    budgetMinVnd: 800_000_000,
    budgetMaxVnd: 1_200_000_000,
    note: 'Cần đất gần đường tỉnh',
    isPinned: true,
    isHidden: false,
    primaryPhone: '0977656280',
    phones: [{ id: 'ph6', phone: '0977656280', label: 'Zalo Khả' }],
    facebook: null,
    latestCareNote: 'Đã gửi bảng giá khu Đông',
    lodatCount: 1,
    createdAt: '2026-07-12T08:00:00.000Z',
    updatedAt: '2026-08-15T09:00:00.000Z',
    careNotes: [
      {
        id: 'care3',
        note: 'Đã gửi bảng giá khu Đông',
        employeeId: MOCK_STAFF.id,
        employeeName: MOCK_STAFF.fullName,
        createdAt: '2026-08-15T09:00:00.000Z',
      },
    ],
  }),
  staffCustomer({
    id: 'cus_pin_4',
    fullName: 'Phạm Thu Hà',
    status: CustomerStatus.KHACH_MOI,
    budgetMinVnd: 2_000_000_000,
    budgetMaxVnd: 3_000_000_000,
    note: null,
    isPinned: true,
    isHidden: false,
    primaryPhone: '0938111222',
    phones: [{ id: 'ph7', phone: '0938111222', label: null }],
    facebook: {
      customerUid: 'fb_page_ha',
      threadId: 'thread_ha',
      facebookName: 'Bùi Xuân Khả',
      avatarUrl: null,
      scanSource: 'page',
    },
    latestCareNote: null,
    lodatCount: 0,
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-14T11:00:00.000Z',
    careNotes: [],
  }),
  staffCustomer({
    id: 'cus_5',
    fullName: 'Đỗ Minh Tuấn',
    status: CustomerStatus.KHACH_CAN_CHAM_SOC,
    budgetMinVnd: null,
    budgetMaxVnd: null,
    note: 'Hỏi thổ cư Sóc Sơn',
    isPinned: false,
    isHidden: false,
    primaryPhone: '0965123456',
    phones: [{ id: 'ph8', phone: '0965123456', label: null }],
    facebook: null,
    latestCareNote: 'Gọi 2 lần chưa nghe máy',
    lodatCount: 0,
    createdAt: '2026-07-20T08:00:00.000Z',
    updatedAt: '2026-08-12T08:00:00.000Z',
    careNotes: [
      {
        id: 'care4',
        note: 'Gọi 2 lần chưa nghe máy',
        employeeId: MOCK_STAFF.id,
        employeeName: MOCK_STAFF.fullName,
        createdAt: '2026-08-12T08:00:00.000Z',
      },
    ],
  }),
  staffCustomer({
    id: 'cus_6',
    fullName: 'Ngô Thị Lan',
    status: CustomerStatus.KHACH_NET,
    budgetMinVnd: 1_000_000_000,
    budgetMaxVnd: 1_500_000_000,
    note: 'Muốn lô góc, ô tô vào',
    isPinned: false,
    isHidden: false,
    primaryPhone: '0988123456',
    phones: [{ id: 'ph9', phone: '0988123456', label: 'Zalo' }],
    facebook: {
      customerUid: 'fb_lan',
      threadId: 'thread_lan',
      facebookName: 'Ngo Thi Lan',
      avatarUrl: null,
      scanSource: 'messenger',
    },
    latestCareNote: 'Chốt xem đất thứ 7',
    lodatCount: 3,
    createdAt: '2026-05-10T08:00:00.000Z',
    updatedAt: '2026-08-11T16:00:00.000Z',
    careNotes: [
      {
        id: 'care5',
        note: 'Chốt xem đất thứ 7',
        employeeId: MOCK_STAFF.id,
        employeeName: MOCK_STAFF.fullName,
        createdAt: '2026-08-11T16:00:00.000Z',
      },
    ],
  }),
  staffCustomer({
    id: 'cus_7',
    fullName: 'Vũ Đức Thành',
    status: CustomerStatus.KHACH_MOI,
    budgetMinVnd: null,
    budgetMaxVnd: null,
    note: null,
    isPinned: false,
    isHidden: false,
    primaryPhone: '0944555666',
    phones: [{ id: 'ph10', phone: '0944555666', label: null }],
    facebook: null,
    latestCareNote: null,
    lodatCount: 0,
    createdAt: '2026-08-08T08:00:00.000Z',
    updatedAt: '2026-08-10T08:00:00.000Z',
    careNotes: [],
  }),
  staffCustomer({
    id: 'cus_8',
    fullName: 'Hoàng Mai Anh',
    status: CustomerStatus.KHACH_NET,
    budgetMinVnd: 3_000_000_000,
    budgetMaxVnd: 4_000_000_000,
    note: 'Đầu tư 2 lô liền kề',
    isPinned: false,
    isHidden: false,
    primaryPhone: '0919000111',
    phones: [{ id: 'ph11', phone: '0919000111', label: null }],
    facebook: {
      customerUid: 'fb_mai',
      threadId: 'thread_mai',
      facebookName: 'Hoang Mai Anh',
      avatarUrl: null,
      scanSource: 'page',
    },
    latestCareNote: 'Đã gửi pháp lý dự án',
    lodatCount: 2,
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-08-09T12:00:00.000Z',
    careNotes: [
      {
        id: 'care6',
        note: 'Đã gửi pháp lý dự án',
        employeeId: MOCK_STAFF.id,
        employeeName: MOCK_STAFF.fullName,
        createdAt: '2026-08-09T12:00:00.000Z',
      },
    ],
  }),
  {
    id: 'cus_hidden',
    employeeId: MOCK_STAFF.id,
    employeeName: MOCK_STAFF.fullName,
    fullName: 'Lê Văn C (đã ẩn)',
    status: CustomerStatus.KHACH_CAN_CHAM_SOC,
    budgetMinVnd: null,
    budgetMaxVnd: null,
    note: 'Spam / không liên hệ được',
    isPinned: false,
    isHidden: true,
    primaryPhone: '0923456789',
    phones: [{ id: 'ph4', phone: '0923456789', label: null }],
    facebook: null,
    latestCareNote: null,
    lodatCount: 0,
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-07-20T12:00:00.000Z',
    careNotes: [],
  },
  {
    id: 'cus_other_staff',
    employeeId: OTHER_EMPLOYEE_ID,
    employeeName: 'Khả Khánh Hà',
    fullName: 'Phạm Thị Dung',
    status: CustomerStatus.KHACH_MOI,
    budgetMinVnd: null,
    budgetMaxVnd: null,
    note: null,
    isPinned: false,
    isHidden: false,
    primaryPhone: '0934567890',
    phones: [{ id: 'ph5', phone: '0934567890', label: null }],
    facebook: {
      customerUid: 'fb_other',
      facebookName: 'Pham Thi Dung',
      threadId: 'thread_other',
      avatarUrl: null,
      scanSource: 'messenger',
    },
    latestCareNote: null,
    lodatCount: 1,
    createdAt: '2026-07-10T08:00:00.000Z',
    updatedAt: '2026-08-05T08:00:00.000Z',
    careNotes: [],
  },
];

export type MockChatMessage = {
  id: string;
  from: 'staff' | 'customer';
  text: string;
  at: string;
};

export const mockChats: Record<string, MockChatMessage[]> = {
  cus_moi_fb: [
    { id: 'm1', from: 'customer', text: 'Anh ơi lô mặt tiền còn không?', at: '2026-08-16T09:40:00.000Z' },
    { id: 'm2', from: 'staff', text: 'Em gửi ảnh và giá ạ, anh xem giúp.', at: '2026-08-16T09:42:00.000Z' },
  ],
  cus_net_phones: [
    { id: 'm3', from: 'staff', text: 'Chị Bích ơi, chủ nhật mình xem lô 38 nhé.', at: '2026-08-16T14:00:00.000Z' },
    { id: 'm4', from: 'customer', text: 'Ok anh, 9h em ra.', at: '2026-08-16T14:05:00.000Z' },
  ],
  cus_6: [
    { id: 'm5', from: 'customer', text: 'Lô góc còn không anh?', at: '2026-08-11T10:00:00.000Z' },
  ],
};

export type MockLodatBrief = {
  id: string;
  title: string;
  area: string;
  price: string;
};

export const mockLodatsByCustomer: Record<string, MockLodatBrief[]> = {
  cus_net_phones: [
    { id: 'ld1', title: 'Lô 38 Quán Táo Đông', area: '80 m²', price: '1,85 tỷ' },
    { id: 'ld2', title: 'Lô 12 đường 21m', area: '90 m²', price: '2,1 tỷ' },
  ],
  cus_pin_3: [{ id: 'ld3', title: 'Lô gần ĐT 296', area: '72 m²', price: '980 triệu' }],
  cus_6: [
    { id: 'ld4', title: 'Lô góc ô tô vào', area: '100 m²', price: '1,35 tỷ' },
    { id: 'ld5', title: 'Lô 5 thổ cư', area: '88 m²', price: '1,2 tỷ' },
    { id: 'ld6', title: 'Lô 9 dự án', area: '75 m²', price: '1,15 tỷ' },
  ],
  cus_8: [
    { id: 'ld7', title: 'Liền kề A1', area: '120 m²', price: '3,2 tỷ' },
    { id: 'ld8', title: 'Liền kề A2', area: '120 m²', price: '3,2 tỷ' },
  ],
};
