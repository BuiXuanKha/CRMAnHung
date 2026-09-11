import { describe, expect, it } from 'vitest';
import {
  formatLodatWebUpdateChangeLine,
  formatLodatWebUpdateChangesMessage,
  mergeLodatWebUpdateChanges,
  parseLodatWebUpdateChanges,
} from './lodats.js';

describe('lodat web update changes', () => {
  it('formats one line like owner example', () => {
    expect(
      formatLodatWebUpdateChangeLine({
        key: 'areaM2',
        label: 'Diện tích',
        from: '90m²',
        to: '100m²',
      }),
    ).toBe('Diện tích thay đổi: 90m² thành 100m²');
  });

  it('lists only change lines in the alert message', () => {
    expect(
      formatLodatWebUpdateChangesMessage([
        { key: 'areaM2', label: 'Diện tích', from: '90m²', to: '100m²' },
        { key: 'title', label: 'Tiêu đề', from: 'A', to: 'B' },
      ]),
    ).toBe('Diện tích thay đổi: 90m² thành 100m²\nTiêu đề thay đổi: A thành B');
  });

  it('merges by key keeping the first from', () => {
    expect(
      mergeLodatWebUpdateChanges(
        [{ key: 'areaM2', label: 'Diện tích', from: '90m²', to: '95m²' }],
        [{ key: 'areaM2', label: 'Diện tích', from: '95m²', to: '100m²' }],
      ),
    ).toEqual([{ key: 'areaM2', label: 'Diện tích', from: '90m²', to: '100m²' }]);
  });

  it('parses prisma json arrays', () => {
    expect(
      parseLodatWebUpdateChanges([
        { key: 'areaM2', label: 'Diện tích', from: '90m²', to: '100m²' },
        { junk: true },
      ]),
    ).toEqual([{ key: 'areaM2', label: 'Diện tích', from: '90m²', to: '100m²' }]);
  });
});
