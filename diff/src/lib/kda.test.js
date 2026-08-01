import { describe, it, expect } from 'vitest';
import { formatKDA, getKDAColor } from './kda.js';

describe('formatKDA', () => {
  it('formats as "kills / deaths / assists"', () => {
    expect(formatKDA(4, 2, 8)).toBe('4 / 2 / 8');
  });
});

describe('getKDAColor', () => {
  it('returns purple for a perfect (0 death) game', () => {
    expect(getKDAColor(5, 0, 3)).toBe('text-purple-500');
  });

  it('returns green for kda >= 5', () => {
    expect(getKDAColor(8, 2, 2)).toBe('text-green-500');
  });

  it('returns blue for kda >= 3 and < 5', () => {
    expect(getKDAColor(6, 2, 2)).toBe('text-blue-500');
  });

  it('returns yellow for kda >= 2 and < 3', () => {
    expect(getKDAColor(3, 2, 1)).toBe('text-yellow-500');
  });

  it('returns gray for kda < 2', () => {
    expect(getKDAColor(1, 5, 1)).toBe('text-gray-500');
  });
});
