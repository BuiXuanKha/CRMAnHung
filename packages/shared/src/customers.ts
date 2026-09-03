/**
 * Customers contract — P1
 * Soft-hide = `isHidden` (không dùng deletedAt ở phase này).
 * List: `limit` mặc định 50, tối đa 200; `offset` từ 0.
 */
import { z } from 'zod';
import { CustomerStatus } from './enums.js';
import { digitsFromPhoneRaw } from './vn-phone.js';

const vnPhoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9}$/, 'SĐT phải gồm 10 số, bắt đầu bằng 0');

const vnPhoneInputSchema = z
  .string()
  .transform((v) => digitsFromPhoneRaw(v))
  .pipe(vnPhoneSchema);

export const customerPhoneSchema = z.object({
  id: z.string(),
  phone: z.string(),
  label: z.string().nullable().optional(),
});

export type CustomerPhone = z.infer<typeof customerPhoneSchema>;

export const customerFacebookSchema = z.object({
  customerUid: z.string().nullable().optional(),
  threadId: z.string().nullable().optional(),
  facebookName: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  scanSource: z.string().nullable().optional(),
  scanSourceLabel: z.string().nullable().optional(),
  employeeFacebookUid: z.string().nullable().optional(),
  /** URL inbox lúc quét (Business Suite / e2ee). Dùng cho menu Mở chat. */
  pageUrl: z.string().nullable().optional(),
});

export type CustomerFacebookMeta = z.infer<typeof customerFacebookSchema>;

export const customerCareNoteSchema = z.object({
  id: z.string(),
  note: z.string(),
  needSummary: z.string().nullable().optional(),
  employeeId: z.string(),
  employeeName: z.string(),
  createdAt: z.string(),
});

export type CustomerCareNote = z.infer<typeof customerCareNoteSchema>;

export const customerSourceHotlineSchema = z.object({
  id: z.string(),
  phone: z.string(),
  label: z.string(),
});

export type CustomerSourceHotline = z.infer<typeof customerSourceHotlineSchema>;

export const customerSourceFacebookProfileSchema = z.object({
  id: z.string(),
  facebookUid: z.string(),
  nickname: z.string().nullable(),
});

export type CustomerSourceFacebookProfile = z.infer<
  typeof customerSourceFacebookProfileSchema
>;

export const customerListItemSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  fullName: z.string(),
  status: z.nativeEnum(CustomerStatus),
  budgetMinVnd: z.number().int().nullable().optional(),
  budgetMaxVnd: z.number().int().nullable().optional(),
  /** Cột dư `tblPerson.Note` — không hiện list/chi tiết. Ô tìm API vẫn khớp. */
  note: z.string().nullable().optional(),
  isPinned: z.boolean(),
  isHidden: z.boolean(),
  pinnedAt: z.string().nullable().optional(),
  autoRestoredAt: z.string().nullable().optional(),
  primaryPhone: z.string().nullable().optional(),
  phones: z.array(customerPhoneSchema).default([]),
  facebook: customerFacebookSchema.nullable().optional(),
  sourceHotline: customerSourceHotlineSchema.nullable().optional(),
  /** Profile/page NV quét khách — cột Kênh liên hệ khi không có hotline. */
  sourceFacebookProfile: customerSourceFacebookProfileSchema.nullable().optional(),
  /** Cột Nhu cầu = NeedSummary mới nhất (care, không rỗng). */
  latestNeedSummary: z.string().nullable().optional(),
  latestCareNote: z.string().nullable().optional(),
  lodatCount: z.number().int().nonnegative().default(0),
  /** Tin đã lưu (cột phụ chat). 0 = ẩn thanh «Nội dung chat». Không phải inbox sống. */
  messageCount: z.number().int().nonnegative().default(0),
  /** Số lần chăm sóc. 0 = ẩn thanh «Lịch sử chăm sóc». */
  careNoteCount: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CustomerListItem = z.infer<typeof customerListItemSchema>;

export const customerDetailSchema = customerListItemSchema.extend({
  careNotes: z.array(customerCareNoteSchema).default([]),
});

export type CustomerDetail = z.infer<typeof customerDetailSchema>;

export const customerListResponseSchema = z.object({
  items: z.array(customerListItemSchema),
  total: z.number().int().nonnegative(),
});

export type CustomerListResponse = z.infer<typeof customerListResponseSchema>;

export const CUSTOMER_LIST_PAGE_SIZE = 50;
export const CUSTOMER_LIST_MAX_PAGE_SIZE = 200;
export const CUSTOMER_LIST_LOAD_MORE_PX = 160;

export const customerListQuerySchema = z.object({
  keyword: z.string().trim().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  includeHidden: z.boolean().optional(),
  hiddenOnly: z.boolean().optional(),
  budgetFilter: z.enum(['none', 'has', 'lt_1b', '1b_2b', 'gt_2b']).optional(),
  contactChannel: z.string().trim().min(1).optional(),
  needFilter: z.enum(['has', 'empty']).optional(),
  lodatFilter: z.enum(['has', 'empty']).optional(),
  limit: z.coerce.number().int().min(1).max(CUSTOMER_LIST_MAX_PAGE_SIZE).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;

export const CUSTOMER_BUDGET_FILTER_OPTIONS = [
  { value: 'all', label: 'Tất cả tài chính' },
  { value: 'none', label: 'Chưa có tài chính' },
  { value: 'has', label: 'Đã có tài chính' },
  { value: 'lt_1b', label: 'Dưới 1 tỷ' },
  { value: '1b_2b', label: '1 tỷ – 2 tỷ' },
  { value: 'gt_2b', label: 'Trên 2 tỷ' },
] as const;

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập tên khách').max(120),
  phone: vnPhoneInputSchema,
  sourceHotlineId: z.string().trim().min(1, 'Vui lòng chọn hotline khách đã liên hệ.'),
  note: z.string().trim().max(500).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const addCustomerPhoneSchema = z.object({
  phone: vnPhoneInputSchema,
});

export type AddCustomerPhoneInput = z.infer<typeof addCustomerPhoneSchema>;

export const updateCustomerPhoneSchema = addCustomerPhoneSchema;

export type UpdateCustomerPhoneInput = AddCustomerPhoneInput;

export const renameCustomerSchema = z.object({
  fullName: z.string().trim().min(1, 'Tên khách không được để trống.').max(120),
});

export type RenameCustomerInput = z.infer<typeof renameCustomerSchema>;

export const phoneDuplicateExistingSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  facebookName: z.string().nullable().optional(),
  primaryPhone: z.string().nullable().optional(),
  hasFacebook: z.boolean(),
  isHidden: z.boolean(),
  status: z.nativeEnum(CustomerStatus),
});

export type PhoneDuplicateExisting = z.infer<typeof phoneDuplicateExistingSchema>;

export const PHONE_DUPLICATE_CODE = 'PHONE_DUPLICATE';

export const acknowledgePhoneDuplicateSchema = z.object({
  fullName: z.string().trim().min(1, 'Tên khách không được để trống.').max(120),
});

export type AcknowledgePhoneDuplicateInput = z.infer<
  typeof acknowledgePhoneDuplicateSchema
>;

export const mergeFacebookIntoPhoneHolderSchema = z.object({
  sourceCustomerId: z.string().min(1),
  targetCustomerId: z.string().min(1),
  phone: vnPhoneInputSchema,
});

export type MergeFacebookIntoPhoneHolderInput = z.infer<
  typeof mergeFacebookIntoPhoneHolderSchema
>;

export const employeeHotlineSchema = z.object({
  id: z.string(),
  phone: z.string(),
  label: z.string(),
  isActive: z.boolean(),
});

export type EmployeeHotline = z.infer<typeof employeeHotlineSchema>;

export const employeeHotlineListSchema = z.object({
  items: z.array(employeeHotlineSchema),
});

export type EmployeeHotlineList = z.infer<typeof employeeHotlineListSchema>;

export const createEmployeeHotlineSchema = z.object({
  phone: vnPhoneInputSchema,
  label: z.string().trim().min(1, 'Vui lòng nhập tên hiển thị.').max(80),
});

export type CreateEmployeeHotlineInput = z.infer<typeof createEmployeeHotlineSchema>;

export const updateEmployeeHotlineSchema = z.object({
  label: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateEmployeeHotlineInput = z.infer<typeof updateEmployeeHotlineSchema>;

export const contactChannelOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  type: z.enum(['facebook', 'hotline']),
  customerCount: z.number().int().nonnegative(),
});

export type ContactChannelOption = z.infer<typeof contactChannelOptionSchema>;

export const contactChannelListSchema = z.object({
  items: z.array(contactChannelOptionSchema),
});

export type ContactChannelList = z.infer<typeof contactChannelListSchema>;

export const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(1, 'Tên khách không được để trống.').max(120).optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  note: z.string().trim().nullable().optional(),
  budgetMinVnd: z.number().int().nonnegative().nullable().optional(),
  budgetMaxVnd: z.number().int().nonnegative().nullable().optional(),
  isPinned: z.boolean().optional(),
  isHidden: z.boolean().optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const CUSTOMER_BUDGET_UNSET_KEY = 'none';
export const CUSTOMER_BUDGET_CUSTOM_KEY = 'custom';

export const CUSTOMER_BUDGET_BRACKETS = [
  { key: '500m_1b', min: 500_000_000, max: 1_000_000_000, label: '500tr – 1 tỷ' },
  { key: '1b_15b', min: 1_000_000_000, max: 1_500_000_000, label: '1 tỷ – 1,5 tỷ' },
  { key: '15b_2b', min: 1_500_000_000, max: 2_000_000_000, label: '1,5 tỷ – 2 tỷ' },
  { key: '2b_25b', min: 2_000_000_000, max: 2_500_000_000, label: '2 tỷ – 2,5 tỷ' },
] as const;

export function findCustomerBudgetBracketKey(
  min?: number | null,
  max?: number | null,
): string {
  if (min == null && max == null) return CUSTOMER_BUDGET_UNSET_KEY;
  const found = CUSTOMER_BUDGET_BRACKETS.find(
    (b) => b.min === Number(min) && b.max === Number(max),
  );
  return found ? found.key : CUSTOMER_BUDGET_CUSTOM_KEY;
}

export const updateCustomerCareSchema = z
  .object({
    status: z.nativeEnum(CustomerStatus),
    budgetMinVnd: z.number().int().nonnegative().nullable(),
    budgetMaxVnd: z.number().int().nonnegative().nullable(),
    needSummary: z.string().max(500).optional(),
    note: z.string().max(1000).optional(),
  })
  .superRefine((val, ctx) => {
    const min = val.budgetMinVnd;
    const max = val.budgetMaxVnd;
    if (min == null && max == null) return;
    if (min == null || max == null || max < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Khoảng tài chính không hợp lệ. Hãy chọn 1 khoảng hoặc «Chưa xác định».',
      });
    }
  });

export type UpdateCustomerCareInput = z.infer<typeof updateCustomerCareSchema>;

export const customerCareUpdateResultSchema = customerDetailSchema.extend({
  unchanged: z.boolean().optional(),
});

export type CustomerCareUpdateResult = z.infer<typeof customerCareUpdateResultSchema>;

export const CUSTOMER_MESSAGE_SENDERS = ['customer', 'me', 'page', 'unknown'] as const;
export type CustomerMessageSender = (typeof CUSTOMER_MESSAGE_SENDERS)[number];

export const CUSTOMER_MESSAGE_SENDER_LABELS: Record<CustomerMessageSender, string> = {
  customer: 'Khách',
  me: 'Tôi',
  page: 'Page',
  unknown: 'Không rõ',
};

export const customerMessengerImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  rotationDeg: z.number().int().default(0),
});

export type CustomerMessengerImage = z.infer<typeof customerMessengerImageSchema>;

export const customerMessengerMessageSchema = z.object({
  id: z.string(),
  body: z.string().nullable(),
  sender: z.enum(CUSTOMER_MESSAGE_SENDERS),
  sortOrder: z.number().int(),
  images: z.array(customerMessengerImageSchema).default([]),
});

export type CustomerMessengerMessage = z.infer<typeof customerMessengerMessageSchema>;

export const customerMessengerThreadSchema = z.object({
  messages: z.array(customerMessengerMessageSchema),
});

export type CustomerMessengerThread = z.infer<typeof customerMessengerThreadSchema>;

/** Extension scan → `POST /api/v1/customers/from-extension` (ảnh chat raster → WebP trên API). */
export const extensionChatMessageSchema = z
  .object({
    id: z.string().optional(),
    text: z.string().optional(),
    sender: z.string().optional(),
    senderUid: z.string().optional(),
    dedupeKey: z.string().optional(),
    imageUrls: z.array(z.string()).optional(),
  })
  .passthrough();

export type ExtensionChatMessage = z.infer<typeof extensionChatMessageSchema>;

export const fromExtensionDraftSchema = z
  .object({
    scanSource: z.string().optional(),
    scanSourceLabel: z.string().optional(),
    pageUrl: z.string().optional(),
    capturedAt: z.string().optional(),
    scan: z
      .object({
        threadId: z.string().optional(),
        customerUid: z.string().optional(),
        customerName: z.string().optional(),
        threadType: z.string().optional(),
        avatarUrl: z.string().optional(),
        employeeUid: z.string().optional(),
        myPageUid: z.string().optional(),
        scanSource: z.string().optional(),
        status: z.string().optional(),
        scanDebug: z.unknown().optional(),
      })
      .passthrough()
      .optional(),
    chatMessages: z.array(extensionChatMessageSchema).optional(),
  })
  .passthrough();

export type FromExtensionDraft = z.infer<typeof fromExtensionDraftSchema>;

export const fromExtensionResultSchema = z.object({
  ok: z.literal(true),
  id: z.string(),
  updated: z.boolean(),
  messagesAppended: z.number().int(),
  messagesUpdated: z.number().int(),
  imagesStored: z.number().int(),
  message: z.string(),
});

export type FromExtensionResult = z.infer<typeof fromExtensionResultSchema>;

/** Lô gắn khách (panel phải / chi tiết) — tái dùng shape list lô. */
export const customerLodatListResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      address: z.string().nullable().optional(),
      areaM2: z.number().nullable().optional(),
      frontageM: z.number().nullable().optional(),
      direction: z.string().nullable().optional(),
      priceVnd: z.union([z.number(), z.string()]).nullable().optional(),
      coverImageUrl: z.string().nullable().optional(),
      extraPhotoCount: z.number().int().nonnegative().default(0),
      status: z.string(),
    }),
  ),
});

export type CustomerLodatListResponse = z.infer<typeof customerLodatListResponseSchema>;
export type CustomerLodatBrief = CustomerLodatListResponse['items'][number];
