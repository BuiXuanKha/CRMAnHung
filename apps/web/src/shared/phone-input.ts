import type { ClipboardEvent, ChangeEvent } from 'react';
import { digitsFromPhoneRaw } from '@crmanhung/shared';

/** onChange after the browser may have already applied maxLength — prefer onPaste too. */
export function phoneDigitsFromChange(e: ChangeEvent<HTMLInputElement>): string {
  return digitsFromPhoneRaw(e.target.value);
}

/**
 * Read the full clipboard. Native `maxLength={10}` otherwise cuts
 * `0977 656 280` to `0977 656 2` before React sees it.
 */
export function handlePhonePaste(
  e: ClipboardEvent<HTMLInputElement>,
  setDigits: (digits: string) => void,
): void {
  e.preventDefault();
  setDigits(digitsFromPhoneRaw(e.clipboardData.getData('text/plain')));
}
