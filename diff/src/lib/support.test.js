import { describe, it, expect } from 'vitest';
import { getSupport } from './support.js';

const participant = (overrides) => ({
  summonerName: 'P',
  teamPosition: '',
  individualPosition: '',
  role: undefined,
  lane: undefined,
  ...overrides,
});

describe('getSupport', () => {
  it('picks the participant with teamPosition UTILITY', () => {
    const team = [
      participant({ summonerName: 'Top', teamPosition: 'TOP' }),
      participant({ summonerName: 'Jungle', teamPosition: 'JUNGLE' }),
      participant({ summonerName: 'Mid', teamPosition: 'MIDDLE' }),
      participant({ summonerName: 'Bot', teamPosition: 'BOTTOM' }),
      participant({ summonerName: 'Support', teamPosition: 'UTILITY' }),
    ];
    expect(getSupport(team)?.summonerName).toBe('Support');
  });

  it('falls back to individualPosition when teamPosition is unresolved', () => {
    const team = [
      participant({ summonerName: 'A', teamPosition: '', individualPosition: 'Invalid' }),
      participant({ summonerName: 'Support', teamPosition: '', individualPosition: 'UTILITY' }),
    ];
    expect(getSupport(team)?.summonerName).toBe('Support');
  });

  it('falls back to legacy role when both position fields are unresolved', () => {
    const team = [
      participant({ summonerName: 'A', teamPosition: '', individualPosition: '' }),
      participant({ summonerName: 'Support', teamPosition: '', individualPosition: '', role: 'DUO_SUPPORT' }),
    ];
    expect(getSupport(team)?.summonerName).toBe('Support');
  });

  it('returns undefined when no signal identifies a support, instead of guessing', () => {
    const team = [
      participant({ summonerName: 'A' }),
      participant({ summonerName: 'B' }),
    ];
    expect(getSupport(team)).toBeUndefined();
  });

  it('prefers teamPosition over a conflicting legacy role on another participant', () => {
    const team = [
      participant({ summonerName: 'RealSupport', teamPosition: 'UTILITY' }),
      participant({ summonerName: 'MisclassifiedByLegacyRole', role: 'SUPPORT' }),
    ];
    expect(getSupport(team)?.summonerName).toBe('RealSupport');
  });
});
