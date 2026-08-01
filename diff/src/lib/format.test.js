import { describe, it, expect } from 'vitest';
import { formatCCTime, formatGameClock } from './format.js';

describe('formatCCTime', () => {
  it('shows sub-minute values in seconds, keeping the resolution that matters for one game', () => {
    expect(formatCCTime(38)).toBe('38s');
    expect(formatCCTime(52)).toBe('52s');
    expect(formatCCTime(59)).toBe('59s');
    expect(formatCCTime(0)).toBe('0s');
  });

  it('keeps the X.Xm convention PlayerPage uses once past a minute', () => {
    expect(formatCCTime(60)).toBe('1.0m');
    // The exact value PlayerPage.test.jsx feeds in — proves no regression there.
    expect(formatCCTime(600)).toBe('10.0m');
  });

  it('treats missing values as zero rather than rendering NaN', () => {
    expect(formatCCTime(undefined)).toBe('0s');
    expect(formatCCTime(null)).toBe('0s');
  });
});

describe('formatGameClock', () => {
  it('formats timeline timestamps as m:ss', () => {
    expect(formatGameClock(0)).toBe('0:00');
    expect(formatGameClock(725000)).toBe('12:05');
    expect(formatGameClock(720000)).toBe('12:00');
    expect(formatGameClock(1860000)).toBe('31:00');
  });

  it('pads seconds so the clock never renders as 12:5', () => {
    expect(formatGameClock(305000)).toBe('5:05');
  });
});
