import { describe, it, expect } from 'vitest';
import { getMinimapUrl, getMinimapFallbackUrl, MINIMAP_SIZE } from './map.js';
import { ITEM_VERSION } from './items.js';

describe('minimap asset URLs', () => {
  it('pins the Data Dragon URL to the shared version constant', () => {
    expect(getMinimapUrl()).toBe(
      `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/map/map11.png`
    );
    // Single-sourced from items.js so the art cannot drift independently.
    expect(getMinimapUrl()).toContain(ITEM_VERSION);
  });

  it('uses the _base_baron1 variant for the Community Dragon fallback', () => {
    // The plain 2dlevelminimap.png path 404s — the variant suffix is required.
    expect(getMinimapFallbackUrl()).toBe(
      'https://raw.communitydragon.org/latest/game/assets/maps/info/map11/2dlevelminimap_base_baron1.png'
    );
  });

  it('defaults to Summoner\'s Rift but accepts an explicit map id', () => {
    expect(getMinimapUrl(12)).toContain('map12.png');
    expect(getMinimapFallbackUrl(12)).toContain('/map12/');
  });

  it('declares the native asset size the projection assumes', () => {
    expect(MINIMAP_SIZE).toBe(512);
  });
});
