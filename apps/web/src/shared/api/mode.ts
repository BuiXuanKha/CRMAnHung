/** Bật UI mock khi chưa có / chưa nối API thật (list khách, lô, …). */
export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === 'true';
}

/**
 * Login giả staff/admin123. Mặc định: theo mock data.
 * Staging/prod: `NEXT_PUBLIC_USE_MOCK_AUTH=false` → `/login` gọi API + bảng User.
 */
export function isMockAuth(): boolean {
  const auth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH;
  if (auth === 'false') return false;
  if (auth === 'true') return true;
  return isMockMode();
}

/**
 * List `/khach-hang`: mock chỉ khi login giả.
 * Login thật (staging) → API khách đã copy (tên, trạng thái, tài chính, ghim, kênh hotline / profile FB).
 */
export function isMockCustomers(): boolean {
  return isMockAuth();
}

/**
 * Sổ địa chỉ: API đã có. Staging login thật → Postgres; chỉ mock khi login giả.
 */
export function isMockAddresses(): boolean {
  return isMockAuth();
}

/**
 * List `/lo-dat`: API đã có. Staging login thật → Lodat + map; chỉ mock khi login giả.
 */
export function isMockLodats(): boolean {
  return isMockAuth();
}

/**
 * List `/giao-dich`: API + copy CRM cũ đã có. Staging login thật → Postgres; chỉ mock khi login giả.
 */
export function isMockTransactions(): boolean {
  return isMockAuth();
}
