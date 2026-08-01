export const SUMMONERS_RIFT_MAP_ID = 11;

/**
 * Riot's bounds for Summoner's Rift. The x and y maxima DIFFER — the playable
 * area is not square, so a single scale factor would skew the projection.
 */
export const MAP_BOUNDS = {
  [SUMMONERS_RIFT_MAP_ID]: {
    min: { x: -120, y: -120 },
    max: { x: 14870, y: 14980 },
  },
};

export function isSupportedMap(mapId) {
  return Object.prototype.hasOwnProperty.call(MAP_BOUNDS, mapId);
}

export function getMapBounds(mapId = SUMMONERS_RIFT_MAP_ID) {
  return MAP_BOUNDS[mapId] ?? null;
}

/**
 * Converts Riot game coordinates to image pixel coordinates.
 *
 * Y IS FLIPPED: game y increases north, image y increases downward. Verified
 * against a known landmark — the blue top outer turret at (981, 10441) lands
 * on pixel (37.61, 153.91) of a 512x512 minimap, i.e. upper-left, which is
 * where it actually sits on the map. Without the flip it would land bottom-left.
 *
 * Returns floats; round only at draw time.
 *
 * @param {{x: number, y: number}} position
 * @param {{width: number, height: number, mapId?: number}} target
 * @returns {{x: number, y: number}|null} null for an unsupported map
 */
export function projectToPixels(position, { width, height, mapId = SUMMONERS_RIFT_MAP_ID }) {
  const bounds = getMapBounds(mapId);
  if (!bounds || !position) return null;

  const spanX = bounds.max.x - bounds.min.x;
  const spanY = bounds.max.y - bounds.min.y;

  return {
    x: ((position.x - bounds.min.x) / spanX) * width,
    y: (1 - (position.y - bounds.min.y) / spanY) * height,
  };
}

export function isWithinBounds(position, mapId = SUMMONERS_RIFT_MAP_ID) {
  const bounds = getMapBounds(mapId);
  if (!bounds || !position) return false;
  return (
    position.x >= bounds.min.x &&
    position.x <= bounds.max.x &&
    position.y >= bounds.min.y &&
    position.y <= bounds.max.y
  );
}

/**
 * Fountain centres per team. Riot keeps reporting a position while a champion
 * is dead — usually the fountain — so samples taken here may represent a dead
 * champion rather than a deliberate presence. Callers flag (never discard)
 * those samples so the heatmap can visually discount them.
 *
 * This is pure geometry, not an inference about game state: we only claim
 * "this sample is near base", never "this champion was dead".
 */
export const FOUNTAINS = {
  100: { x: 396, y: 462 },
  200: { x: 14340, y: 14390 },
};

export const FOUNTAIN_RADIUS = 1200;

export function isInFountain(position, teamId) {
  const fountain = FOUNTAINS[teamId];
  if (!fountain || !position) return false;
  const dx = position.x - fountain.x;
  const dy = position.y - fountain.y;
  return Math.sqrt(dx * dx + dy * dy) <= FOUNTAIN_RADIUS;
}
