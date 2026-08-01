import { describe, it, expect } from 'vitest';
import { aggregatePlayerStats } from './stats.js';
import { formatMatchData } from '../../api/lib/formatMatchData.js';
import matchRankedNormal from '../../api/__fixtures__/matchRankedNormal.json';

describe('aggregatePlayerStats', () => {
  it('returns null when there are no matches', () => {
    expect(aggregatePlayerStats(null, 'Anyone')).toBeNull();
    expect(aggregatePlayerStats([], 'Anyone')).toBeNull();
  });

  it('keeps totalHealSelfInclusive and healingDoneToAllies as distinct sums for the support', () => {
    const match = formatMatchData(matchRankedNormal);
    const stats = aggregatePlayerStats([match], 'BlueSupport');

    expect(stats.games).toBe(1);
    expect(stats.totalHealSelfInclusive).toBe(9200);
    expect(stats.healingDoneToAllies).toBe(7400);
    expect(stats.totalHealSelfInclusive).not.toBe(stats.healingDoneToAllies);
  });

  it('computes winRate and kda from aggregated totals', () => {
    const match = formatMatchData(matchRankedNormal);
    const stats = aggregatePlayerStats([match, match], 'BlueSupport');

    expect(stats.games).toBe(2);
    expect(stats.winRate).toBe('100.0');
    // BlueSupport: 1 kill, 4 deaths, 15 assists per game -> summed 2/8/30
    expect(stats.kda).toBe(((2 + 30) / 8).toFixed(2));
  });
});
