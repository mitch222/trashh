import { describe, it, expect } from 'vitest';
import {
  ROUTING_REGIONS,
  isValidRegion,
  isValidPuuid,
  isValidMatchId,
  isValidGameName,
  isValidTagLine,
  riotUrl,
} from './riotInput.js';

describe('isValidRegion', () => {
  it('accepts exactly the four Riot routing regions', () => {
    expect(ROUTING_REGIONS).toEqual(['americas', 'asia', 'europe', 'sea']);
    for (const r of ROUTING_REGIONS) expect(isValidRegion(r)).toBe(true);
  });

  // These are the payloads that turned `https://${region}.api.riotgames.com`
  // into a request to an attacker's host, carrying our X-Riot-Token. The
  // localhost:9999 one was reproduced against a live `vercel dev`.
  it('rejects every SSRF payload that escapes the hostname template', () => {
    const payloads = [
      'localhost:9999//',
      'attacker.com//',
      'attacker.com#',
      'attacker.com?',
      'attacker.com%2F%2F',
      '127.0.0.1//',
      'americas.evil.com',
      'americas/../../',
      '169.254.169.254//',
      'AMERICAS',
      '',
      null,
      undefined,
    ];
    for (const p of payloads) expect(isValidRegion(p)).toBe(false);
  });
});

describe('riotUrl', () => {
  it('builds a Riot host URL for a valid region', () => {
    expect(riotUrl('americas', '/riot/x')).toBe('https://americas.api.riotgames.com/riot/x');
  });

  // Defence in depth: even if a handler forgets its own check, no URL can be
  // produced that points anywhere but Riot.
  it('refuses to build a URL from an unvalidated region', () => {
    expect(() => riotUrl('attacker.com//', '/riot/x')).toThrowError(/Region/i);
    try {
      riotUrl('attacker.com//', '/riot/x');
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.code).toBe('INVALID_REGION');
    }
  });

  it('never yields a URL whose host is not riotgames.com', () => {
    for (const region of ROUTING_REGIONS) {
      const { host } = new URL(riotUrl(region, '/x'));
      expect(host.endsWith('.api.riotgames.com')).toBe(true);
    }
  });
});

describe('isValidPuuid', () => {
  it('accepts a real puuid', () => {
    expect(
      isValidPuuid('AT4j4rLkEP_dG3rj2bqplXLiJeVdJPDol2D_S0aySooD5SXN8z4gTXutOffhqs_nyAT5LhnrQYU1wA')
    ).toBe(true);
  });

  it('rejects anything that could traverse or escape a path segment', () => {
    for (const bad of ['../../etc/passwd', 'a/b', 'x'.repeat(200), 'short', '', null, 'abc%2F..']) {
      expect(isValidPuuid(bad)).toBe(false);
    }
  });
});

describe('isValidMatchId', () => {
  it('accepts real match ids from several platforms', () => {
    for (const id of ['KR_8326285335', 'LA1_1738133676', 'EUW1_7923240080']) {
      expect(isValidMatchId(id)).toBe(true);
    }
  });

  it('rejects traversal and injection attempts', () => {
    for (const bad of ['../timeline', 'KR_123', 'kr_8326285335', 'KR_8326285335/x', '', null]) {
      expect(isValidMatchId(bad)).toBe(false);
    }
  });
});

describe('Riot ID validation', () => {
  // Regression: an early draft forbade spaces, which would have rejected every
  // account with one — including "Hide on bush", used throughout the tests.
  it('accepts real names with spaces and non-Latin scripts', () => {
    for (const name of ['Hide on bush', 'mitch222', 'Faker', '람곰치', 'Nostalgia']) {
      expect(isValidGameName(name)).toBe(true);
    }
  });

  it('rejects names carrying URL-significant characters', () => {
    for (const bad of ['a/b', 'a?b', 'a#b', 'a%2Fb', 'a\\b', 'a&b', 'a=b', 'a:b', 'a@b', '']) {
      expect(isValidGameName(bad)).toBe(false);
    }
  });

  it('enforces Riot ID length limits', () => {
    expect(isValidGameName('x'.repeat(17))).toBe(false);
    expect(isValidTagLine('x')).toBe(false);
    expect(isValidTagLine('x'.repeat(6))).toBe(false);
    expect(isValidTagLine('KR1')).toBe(true);
    expect(isValidTagLine('mitch')).toBe(true);
  });
});
