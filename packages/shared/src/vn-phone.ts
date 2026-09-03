/** Vietnam mobile input — 10 digits starting with 0. */

export const VN_PHONE_DIGIT_LIMIT = 10;

/**
 * Strip spaces / punctuation / +84, then keep at most 10 digits.
 * Lets paste of `0977 656 280` or `+84 977 656 280` survive an input `maxLength`.
 */
export function digitsFromPhoneRaw(raw: string): string {
  let value = String(raw ?? '').trim().replace(/[\s.\-()]/g, '');
  if (value.startsWith('+84')) {
    value = `0${value.slice(3)}`;
  }
  value = value.replace(/\D/g, '');
  if (value.startsWith('84') && value.length === 11) {
    value = `0${value.slice(2)}`;
  }
  return value.slice(0, VN_PHONE_DIGIT_LIMIT);
}
