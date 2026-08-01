import { describe, it, expect } from 'vitest';
import { getProfileIconUrl, ITEM_VERSION } from './items.js';

describe('getProfileIconUrl', () => {
  it('builds a Data Dragon profile icon URL pinned to the shared version', () => {
    expect(getProfileIconUrl(23)).toBe(
      `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/profileicon/23.png`
    );
  });

  it('treats icon id 0 as a real id, not a missing one', () => {
    expect(getProfileIconUrl(0)).toBe(
      `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/profileicon/0.png`
    );
  });

  it('returns null only for a genuinely absent id', () => {
    expect(getProfileIconUrl(null)).toBeNull();
    expect(getProfileIconUrl(undefined)).toBeNull();
  });
});
