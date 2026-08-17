'use client';

import type { LucideIcon, LucideProps } from 'lucide-react';

/** Standard CRM icon sizes — UI-GUIDELINES §4.6 */
export const ICON_SIZE = {
  mini: 12,
  sm: 16,
  md: 18,
} as const;

export type IconSize = keyof typeof ICON_SIZE;

type Props = LucideProps & {
  icon: LucideIcon;
  size?: IconSize | number;
};

/** Thin Lucide wrapper with CRM default stroke + size tokens. */
export function Icon({ icon: Lucide, size = 'sm', strokeWidth = 2, ...rest }: Props) {
  const px = typeof size === 'number' ? size : ICON_SIZE[size];
  return <Lucide size={px} strokeWidth={strokeWidth} aria-hidden {...rest} />;
}
