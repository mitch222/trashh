import { describe, it, expect } from 'vitest';
import { RiotTimelineDtoSchema } from '../../shared/schemas/riotTimeline.schema.js';
import timelineRankedNormal from './timelineRankedNormal.json';
import matchRankedNormal from './matchRankedNormal.json';

// Provenance: this fixture is hand-built (script-generated once, then checked
// in as plain data), not a real Riot dump. A real timeline is 567 KB median —
// it would be the largest file in the repo by 40x, unreviewable in a diff, and
// would bury the specific edge cases these tests need in thousands of
// irrelevant frames. Its shape mirrors real match-v5 timeline responses:
// frameInterval 60000, participantFrames keyed "1".."10", ward events without
// positions, positioned combat events with them.

const allEvents = (timeline) => timeline.info.frames.flatMap((f) => f.events);

const POSITIONED_TYPES = [
  'CHAMPION_KILL',
  'CHAMPION_SPECIAL_KILL',
  'ELITE_MONSTER_KILL',
  'BUILDING_KILL',
  'TURRET_PLATE_DESTROYED',
];

describe('timelineRankedNormal.json matches the Riot match-v5 timeline schema', () => {
  it('is a valid raw Riot timeline', () => {
    expect(() => RiotTimelineDtoSchema.parse(timelineRankedNormal)).not.toThrow();
  });

  it('uses a 60000ms frame interval with one frame per game minute of matchRankedNormal', () => {
    expect(timelineRankedNormal.info.frameInterval).toBe(60000);
    // matchRankedNormal.json has gameDuration 1875 -> floor(1875/60)+1 = 32.
    // If these two disagree the fixtures contradict each other.
    const expectedFrames = Math.floor(matchRankedNormal.info.gameDuration / 60) + 1;
    expect(timelineRankedNormal.info.frames).toHaveLength(expectedFrames);
  });

  it('matches matchRankedNormal.json matchId, so the two fixtures compose', () => {
    expect(timelineRankedNormal.metadata.matchId).toBe(matchRankedNormal.metadata.matchId);
  });

  it('keys participantFrames by the strings "1".."10", not by array index', () => {
    for (const frame of timelineRankedNormal.info.frames) {
      expect(Array.isArray(frame.participantFrames)).toBe(false);
      expect(Object.keys(frame.participantFrames)).toEqual(
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
      );
    }
  });

  it('gives every participantFrame a position inside the real observed map range', () => {
    for (const frame of timelineRankedNormal.info.frames) {
      for (const pf of Object.values(frame.participantFrames)) {
        expect(pf.position).toBeDefined();
        expect(pf.position.x).toBeGreaterThanOrEqual(194);
        expect(pf.position.x).toBeLessThanOrEqual(14539);
        expect(pf.position.y).toBeGreaterThanOrEqual(269);
        expect(pf.position.y).toBeLessThanOrEqual(14582);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────
  // THE honesty pin. This assertion encodes the entire premise of the
  // minimap feature.
  //
  // Verified against 21 real Riot timelines: 0 of 3,025 WARD_PLACED /
  // WARD_KILL events carry a position. Riot removed ward coordinates from
  // the API deliberately. If someone later "improves" this fixture by
  // adding ward coordinates, every downstream feature would silently start
  // rendering fabricated data — so this is a hard CI failure with the
  // reason written next to it.
  // ─────────────────────────────────────────────────────────────────────
  it('has NO ward event carrying a position, because Riot does not expose ward coordinates', () => {
    const wardEvents = allEvents(timelineRankedNormal).filter(
      (e) => e.type === 'WARD_PLACED' || e.type === 'WARD_KILL'
    );
    expect(wardEvents.length).toBeGreaterThan(0);
    expect(wardEvents.filter((e) => e.position !== undefined)).toEqual([]);
  });

  it('gives every positioned-type event an exact position', () => {
    const positioned = allEvents(timelineRankedNormal).filter((e) =>
      POSITIONED_TYPES.includes(e.type)
    );
    expect(positioned.length).toBeGreaterThan(0);
    for (const event of positioned) {
      expect(event.position).toBeDefined();
      expect(typeof event.position.x).toBe('number');
      expect(typeof event.position.y).toBe('number');
    }
  });

  it('reproduces the real-world WARD_PLACED defects: one missing creatorId, one exact duplicate', () => {
    const placements = allEvents(timelineRankedNormal).filter((e) => e.type === 'WARD_PLACED');

    // Riot dev-relations issue #96: creatorId is sometimes omitted.
    expect(placements.filter((e) => e.creatorId === undefined)).toHaveLength(1);

    // ...and events are sometimes duplicated outright.
    const keys = placements.map((e) => `${e.timestamp}|${e.creatorId}|${e.wardType}`);
    const duplicated = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(duplicated).toHaveLength(1);
  });

  it('carries the known-good calibration point as a BUILDING_KILL', () => {
    // Blue top outer turret. mapCoords.test.js pins that (981,10441)
    // projects to pixel (38,154) on a 512x512 minimap.
    const calibration = allEvents(timelineRankedNormal).find(
      (e) => e.type === 'BUILDING_KILL' && e.position.x === 981 && e.position.y === 10441
    );
    expect(calibration).toBeDefined();
  });

  it('includes heavy fields and noise events for the projector to strip', () => {
    // Exactly one participantFrame carries the heavy stats, so
    // projectTimeline.test.js can prove the stripping works.
    expect(timelineRankedNormal.info.frames[0].participantFrames['1'].championStats).toBeDefined();
    expect(timelineRankedNormal.info.frames[0].participantFrames['1'].damageStats).toBeDefined();

    const types = new Set(allEvents(timelineRankedNormal).map((e) => e.type));
    expect(types.has('ITEM_PURCHASED')).toBe(true);
    expect(types.has('LEVEL_UP')).toBe(true);
    expect(types.has('SKILL_LEVEL_UP')).toBe(true);
    expect(types.has('GAME_END')).toBe(true);

    const withDamageBreakdown = allEvents(timelineRankedNormal).filter(
      (e) => e.victimDamageDealt !== undefined
    );
    expect(withDamageBreakdown.length).toBeGreaterThan(0);
  });
});
