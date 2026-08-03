import { SUMMONERS_RIFT_MAP_ID } from './mapCoords';

/**
 * Every turret and inhibitor on Summoner's Rift, in Riot game coordinates.
 *
 * DERIVED FROM RIOT DATA, NOT COPIED FROM A WIKI. Structures never move, so
 * a BUILDING_KILL event's `position` *is* that structure's position. This
 * table was built by collecting all 431 BUILDING_KILL events across 40 real
 * timelines and grouping them by (teamId, buildingType, laneType, towerType).
 * Every group collapsed to exactly one distinct coordinate — the two
 * NEXUS_TURRET groups collapsed to exactly two, which is correct because each
 * team has a pair. Nothing here is interpolated, mirrored or guessed.
 *
 * Cross-check: team 100's TOP_LANE OUTER_TURRET lands on (981, 10441), the
 * same landmark mapCoords.js's projection was calibrated against.
 *
 * `teamId` is the team that OWNS the structure (matching Riot's own use of
 * `teamId` on BUILDING_KILL, which reports the victim team, not the killer).
 *
 * The nexus is the one entry NOT taken from an event: Riot emits no
 * BUILDING_KILL for it (confirmed — 0 NEXUS_BUILDING events across the same 40
 * timelines; destroying it ends the game). Its coordinate is the midpoint of
 * the team's own two nexus turrets, which ARE measured. That places it within
 * a few pixels of the real building at minimap scale, and it is flagged
 * `approximate` so nothing can present it as a surveyed position.
 */
export const STRUCTURES = [
  // --- Team 100 (blue) ---
  { id: 'b-top-outer', teamId: 100, kind: 'TOWER', lane: 'TOP_LANE', tier: 'OUTER_TURRET', x: 981, y: 10441 },
  { id: 'b-top-inner', teamId: 100, kind: 'TOWER', lane: 'TOP_LANE', tier: 'INNER_TURRET', x: 1512, y: 6699 },
  { id: 'b-top-base', teamId: 100, kind: 'TOWER', lane: 'TOP_LANE', tier: 'BASE_TURRET', x: 1169, y: 4287 },
  { id: 'b-mid-outer', teamId: 100, kind: 'TOWER', lane: 'MID_LANE', tier: 'OUTER_TURRET', x: 5846, y: 6396 },
  { id: 'b-mid-inner', teamId: 100, kind: 'TOWER', lane: 'MID_LANE', tier: 'INNER_TURRET', x: 5048, y: 4812 },
  { id: 'b-mid-base', teamId: 100, kind: 'TOWER', lane: 'MID_LANE', tier: 'BASE_TURRET', x: 3651, y: 3696 },
  { id: 'b-bot-outer', teamId: 100, kind: 'TOWER', lane: 'BOT_LANE', tier: 'OUTER_TURRET', x: 10504, y: 1029 },
  { id: 'b-bot-inner', teamId: 100, kind: 'TOWER', lane: 'BOT_LANE', tier: 'INNER_TURRET', x: 6919, y: 1483 },
  { id: 'b-bot-base', teamId: 100, kind: 'TOWER', lane: 'BOT_LANE', tier: 'BASE_TURRET', x: 4281, y: 1253 },
  { id: 'b-nexus-1', teamId: 100, kind: 'TOWER', lane: 'MID_LANE', tier: 'NEXUS_TURRET', x: 1748, y: 2270 },
  { id: 'b-nexus-2', teamId: 100, kind: 'TOWER', lane: 'MID_LANE', tier: 'NEXUS_TURRET', x: 2177, y: 1807 },
  { id: 'b-inhib-top', teamId: 100, kind: 'INHIBITOR', lane: 'TOP_LANE', tier: null, x: 1172, y: 3583 },
  { id: 'b-inhib-mid', teamId: 100, kind: 'INHIBITOR', lane: 'MID_LANE', tier: null, x: 3210, y: 3217 },
  { id: 'b-inhib-bot', teamId: 100, kind: 'INHIBITOR', lane: 'BOT_LANE', tier: null, x: 3468, y: 1230 },
  // Midpoint of b-nexus-1 / b-nexus-2 — see the note above.
  { id: 'b-nexus', teamId: 100, kind: 'NEXUS', lane: null, tier: null, x: 1963, y: 2039, approximate: true },

  // --- Team 200 (red) ---
  { id: 'r-top-outer', teamId: 200, kind: 'TOWER', lane: 'TOP_LANE', tier: 'OUTER_TURRET', x: 4318, y: 13875 },
  { id: 'r-top-inner', teamId: 200, kind: 'TOWER', lane: 'TOP_LANE', tier: 'INNER_TURRET', x: 7943, y: 13411 },
  { id: 'r-top-base', teamId: 200, kind: 'TOWER', lane: 'TOP_LANE', tier: 'BASE_TURRET', x: 10481, y: 13650 },
  { id: 'r-mid-outer', teamId: 200, kind: 'TOWER', lane: 'MID_LANE', tier: 'OUTER_TURRET', x: 8955, y: 8510 },
  { id: 'r-mid-inner', teamId: 200, kind: 'TOWER', lane: 'MID_LANE', tier: 'INNER_TURRET', x: 9767, y: 10113 },
  { id: 'r-mid-base', teamId: 200, kind: 'TOWER', lane: 'MID_LANE', tier: 'BASE_TURRET', x: 11134, y: 11207 },
  { id: 'r-bot-outer', teamId: 200, kind: 'TOWER', lane: 'BOT_LANE', tier: 'OUTER_TURRET', x: 13866, y: 4505 },
  { id: 'r-bot-inner', teamId: 200, kind: 'TOWER', lane: 'BOT_LANE', tier: 'INNER_TURRET', x: 13327, y: 8226 },
  { id: 'r-bot-base', teamId: 200, kind: 'TOWER', lane: 'BOT_LANE', tier: 'BASE_TURRET', x: 13624, y: 10572 },
  { id: 'r-nexus-1', teamId: 200, kind: 'TOWER', lane: 'MID_LANE', tier: 'NEXUS_TURRET', x: 13052, y: 12612 },
  { id: 'r-nexus-2', teamId: 200, kind: 'TOWER', lane: 'MID_LANE', tier: 'NEXUS_TURRET', x: 12611, y: 13084 },
  { id: 'r-inhib-top', teamId: 200, kind: 'INHIBITOR', lane: 'TOP_LANE', tier: null, x: 11275, y: 13657 },
  { id: 'r-inhib-mid', teamId: 200, kind: 'INHIBITOR', lane: 'MID_LANE', tier: null, x: 11593, y: 11669 },
  { id: 'r-inhib-bot', teamId: 200, kind: 'INHIBITOR', lane: 'BOT_LANE', tier: null, x: 13599, y: 11319 },
  // Midpoint of r-nexus-1 / r-nexus-2 — see the note above.
  { id: 'r-nexus', teamId: 200, kind: 'NEXUS', lane: null, tier: null, x: 12832, y: 12848, approximate: true },
];

/**
 * Neutral objective pits, in Riot game coordinates.
 *
 * Derived the same way as the structures: an ELITE_MONSTER_KILL's `position`
 * is where that monster died, and monsters die in their pit. Averaged over
 * real kills across the same set of timelines.
 *
 *   BARON_NASHOR  n=20  median distance to centre 3u, max 64u  -> effectively a point
 *   DRAGON        n=78  median 225u, max 928u                  -> the pit has room to fight in
 *
 * The dragon spread is wider because a dragon can be finished anywhere inside
 * its pit, so this marks the pit, not a precise tile. Rift Herald and the
 * Voidgrubs share the Baron pit and are therefore not separate markers.
 */
export const OBJECTIVES = [
  { id: 'obj-baron', kind: 'BARON', label: 'Foso de Barón', x: 5010, y: 10470 },
  { id: 'obj-dragon', kind: 'DRAGON', label: 'Foso de Dragón', x: 9941, y: 4596 },
];

/** Squared distance below which a BUILDING_KILL is taken to be this structure. */
const MATCH_RADIUS = 600;

/**
 * Resolves which structure a BUILDING_KILL destroyed.
 *
 * Position is the primary key because it is what the table was built from and
 * it disambiguates the nexus-turret pair, which shares every other field.
 * Falling back to (teamId, lane, tier) keeps a structure identifiable if Riot
 * ever omits the position rather than dropping the event on the floor.
 */
function matchStructure(event) {
  // The nexus is never a candidate: Riot emits no BUILDING_KILL for it, and
  // its approximate coordinate sits close enough to the nexus turrets that
  // leaving it in the search could steal one of their kills.
  const candidates = STRUCTURES.filter((s) => s.kind !== 'NEXUS');

  if (event.position) {
    let best = null;
    let bestDistance = Infinity;
    for (const structure of candidates) {
      const dx = structure.x - event.position.x;
      const dy = structure.y - event.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = structure;
      }
    }
    if (best && bestDistance <= MATCH_RADIUS) return best;
  }

  const kind = event.buildingType === 'INHIBITOR_BUILDING' ? 'INHIBITOR' : 'TOWER';
  return (
    candidates.find(
      (s) =>
        s.teamId === event.teamId &&
        s.kind === kind &&
        s.lane === event.laneType &&
        // A tier-less inhibitor matches on lane alone; a turret must agree.
        (kind === 'INHIBITOR' || s.tier === event.towerType)
    ) ?? null
  );
}

/**
 * State of every structure at one instant.
 *
 * Purely factual: a structure is destroyed iff a BUILDING_KILL matching it
 * carries a timestamp at or before `timestampMs`. Nothing is inferred, and
 * inhibitors are NOT respawned after their ~5 minute timer — that timer is a
 * game rule the timeline never reports, so the honest reading of the data is
 * "destroyed at least once by now", which is what `destroyedAtMs` says.
 *
 * @param {Array<object>} events - projected timeline events
 * @param {number} timestampMs
 * @returns {Array<object>} STRUCTURES entries plus `destroyed` / `destroyedAtMs`
 */
export function structuresAt(events, timestampMs) {
  const destroyedAt = new Map();

  for (const event of events || []) {
    if (event.type !== 'BUILDING_KILL') continue;
    const structure = matchStructure(event);
    if (!structure) continue;
    const previous = destroyedAt.get(structure.id);
    if (previous === undefined || event.timestamp < previous) {
      destroyedAt.set(structure.id, event.timestamp);
    }
  }

  return STRUCTURES.map((structure) => {
    const at = destroyedAt.get(structure.id);
    const destroyed = at !== undefined && at <= timestampMs;
    return { ...structure, destroyed, destroyedAtMs: destroyed ? at : null };
  });
}

export function isSupportedStructureMap(mapId) {
  return mapId === SUMMONERS_RIFT_MAP_ID;
}
