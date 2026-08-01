import { describe, it, expect } from 'vitest';
import {
  projectToPixels,
  isWithinBounds,
  isInFountain,
  isSupportedMap,
  getMapBounds,
  MAP_BOUNDS,
  SUMMONERS_RIFT_MAP_ID,
} from './mapCoords.js';

const SIZE_512 = { width: 512, height: 512 };

describe('projectToPixels', () => {
  it('projects the blue top outer turret to the upper-left quadrant of a 512x512 minimap', () => {
    // The calibration anchor for the whole feature. This turret really is in
    // the upper-left of the minimap, and timelineRankedNormal.json carries a
    // BUILDING_KILL at exactly these coordinates.
    const px = projectToPixels({ x: 981, y: 10441 }, SIZE_512);
    expect(px.x).toBeCloseTo(37.606, 2);
    expect(px.y).toBeCloseTo(153.905, 2);
    expect([Math.round(px.x), Math.round(px.y)]).toEqual([38, 154]);
  });

  it('flips y: a high game-y maps to a low pixel-y', () => {
    const north = projectToPixels({ x: 7000, y: 14000 }, SIZE_512);
    const south = projectToPixels({ x: 7000, y: 1000 }, SIZE_512);
    expect(north.y).toBeLessThan(south.y);
  });

  it('puts blue base bottom-left and red base top-right', () => {
    const blueBase = projectToPixels({ x: 396, y: 462 }, SIZE_512);
    const redBase = projectToPixels({ x: 14340, y: 14390 }, SIZE_512);

    expect(blueBase.x).toBeLessThan(256);
    expect(blueBase.y).toBeGreaterThan(256);
    expect(redBase.x).toBeGreaterThan(256);
    expect(redBase.y).toBeLessThan(256);
  });

  it('does not assume a square map', () => {
    const bounds = MAP_BOUNDS[SUMMONERS_RIFT_MAP_ID];
    expect(bounds.max.x).not.toBe(bounds.max.y);

    // A point at equal game x and y must not land on the pixel diagonal,
    // which is what a single shared scale factor would produce.
    const px = projectToPixels({ x: 7000, y: 7000 }, SIZE_512);
    expect(px.x).not.toBeCloseTo(512 - px.y, 5);
  });

  it('scales linearly with image size', () => {
    const at512 = projectToPixels({ x: 981, y: 10441 }, SIZE_512);
    const at1024 = projectToPixels({ x: 981, y: 10441 }, { width: 1024, height: 1024 });
    expect(at1024.x).toBeCloseTo(at512.x * 2, 6);
    expect(at1024.y).toBeCloseTo(at512.y * 2, 6);
  });

  it('returns null for an unsupported map instead of projecting with wrong bounds', () => {
    expect(projectToPixels({ x: 100, y: 100 }, { ...SIZE_512, mapId: 12 })).toBeNull();
    expect(projectToPixels(null, SIZE_512)).toBeNull();
  });
});

describe('isWithinBounds', () => {
  it('accepts the full range observed in real timelines', () => {
    // Real range measured from a live match: x[130,14589] y[135,14673].
    expect(isWithinBounds({ x: 130, y: 135 })).toBe(true);
    expect(isWithinBounds({ x: 14589, y: 14673 })).toBe(true);
  });

  it('rejects points outside the map', () => {
    expect(isWithinBounds({ x: -500, y: 5000 })).toBe(false);
    expect(isWithinBounds({ x: 5000, y: 20000 })).toBe(false);
  });
});

describe('isInFountain', () => {
  it('flags samples at each team fountain', () => {
    expect(isInFountain({ x: 396, y: 462 }, 100)).toBe(true);
    expect(isInFountain({ x: 14340, y: 14390 }, 200)).toBe(true);
  });

  it('does not flag a fountain-adjacent position for the opposing team', () => {
    expect(isInFountain({ x: 396, y: 462 }, 200)).toBe(false);
  });

  it('does not flag midfield positions', () => {
    expect(isInFountain({ x: 7500, y: 7500 }, 100)).toBe(false);
    expect(isInFountain({ x: 7500, y: 7500 }, 200)).toBe(false);
  });

  it('returns false for an unknown team rather than throwing', () => {
    expect(isInFountain({ x: 396, y: 462 }, 999)).toBe(false);
  });
});

describe('map support', () => {
  it('supports Summoner\'s Rift only', () => {
    expect(isSupportedMap(11)).toBe(true);
    expect(isSupportedMap(12)).toBe(false);
    expect(getMapBounds(12)).toBeNull();
  });
});
