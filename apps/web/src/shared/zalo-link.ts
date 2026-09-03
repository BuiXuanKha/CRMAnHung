/** Zalo deep link từ SĐT VN — cùng quy tắc trang public. */
export function zaloMeUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const id = digits.startsWith('84')
    ? digits
    : digits.startsWith('0')
      ? `84${digits.slice(1)}`
      : digits;
  return `https://zalo.me/${id}`;
}
