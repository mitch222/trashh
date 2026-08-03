import { describe, it, expect } from 'vitest';
import { STRUCTURES, OBJECTIVES, structuresAt } from './structures';
import { projectToPixels } from './mapCoords';
import { projectTimeline } from '../../api/lib/projectTimeline.js';
import rawTimeline from '../../api/__fixtures__/timelineRankedNormal.json';

const timeline = projectTimeline(rawTimeline);
const buildingKills = timeline.events.filter((e) => e.type === 'BUILDING_KILL');

describe('STRUCTURES table', () => {
  it('has the 15 structures each team really owns', () => {
    for (const teamId of [100, 200]) {
      const mine = STRUCTURES.filter((s) => s.teamId === teamId);
      // 9 lane turrets + 2 nexus turrets + 3 inhibitors + 1 nexus
      expect(mine.filter((s) => s.kind === 'TOWER')).toHaveLength(11);
      expect(mine.filter((s) => s.kind === 'INHIBITOR')).toHaveLength(3);
      expect(mine.filter((s) => s.kind === 'NEXUS')).toHaveLength(1);
    }
  });

  it('flags the nexus as approximate and nothing else', () => {
    // Every other coordinate is a surveyed BUILDING_KILL position; the nexus
    // is the only one derived geometrically, so it must say so.
    const approximate = STRUCTURES.filter((s) => s.approximate);
    expect(approximate.map((s) => s.id).sort()).toEqual(['b-nexus', 'r-nexus']);
  });

  it('puts each nexus between its own two nexus turrets', () => {
    for (const [nexusId, aId, bId] of [
      ['b-nexus', 'b-nexus-1', 'b-nexus-2'],
      ['r-nexus', 'r-nexus-1', 'r-nexus-2'],
    ]) {
      const find = (id) => STRUCTURES.find((s) => s.id === id);
      const nexus = find(nexusId);
      const a = find(aId);
      const b = find(bId);
      // Stored rounded to whole game units, so compare the rounded midpoint.
      expect(nexus.x).toBe(Math.round((a.x + b.x) / 2));
      expect(nexus.y).toBe(Math.round((a.y + b.y) / 2));
    }
  });

  it('gives every structure a unique id', () => {
    const ids = new Set(STRUCTURES.map((s) => s.id));
    expect(ids.size).toBe(STRUCTURES.length);
  });

  it('keeps every structure inside the projected map', () => {
    for (const structure of STRUCTURES) {
      const pixel = projectToPixels(structure, { width: 512, height: 512 });
      expect(pixel.x).toBeGreaterThanOrEqual(0);
      expect(pixel.x).toBeLessThanOrEqual(512);
      expect(pixel.y).toBeGreaterThanOrEqual(0);
      expect(pixel.y).toBeLessThanOrEqual(512);
    }
  });

  it('places the blue top outer turret on the calibration landmark', () => {
    // (981, 10441) is corroborated three ways: 37 real BUILDING_KILL events,
    // mapCoords.js's projection calibration, and the fixture below.
    const turret = STRUCTURES.find((s) => s.id === 'b-top-outer');
    expect(turret).toMatchObject({ x: 981, y: 10441, teamId: 100 });
  });
});

describe('OBJECTIVES', () => {
  it('marks the Baron and Dragon pits', () => {
    expect(OBJECTIVES.map((o) => o.kind).sort()).toEqual(['BARON', 'DRAGON']);
  });

  it('keeps every pit inside the projected map', () => {
    for (const objective of OBJECTIVES) {
      const pixel = projectToPixels(objective, { width: 512, height: 512 });
      expect(pixel.x).toBeGreaterThan(0);
      expect(pixel.x).toBeLessThan(512);
      expect(pixel.y).toBeGreaterThan(0);
      expect(pixel.y).toBeLessThan(512);
    }
  });

  it('puts the two pits on opposite sides of the river', () => {
    const baron = OBJECTIVES.find((o) => o.kind === 'BARON');
    const dragon = OBJECTIVES.find((o) => o.kind === 'DRAGON');
    // Baron sits top-left of centre, Dragon bottom-right — never swapped.
    expect(baron.x).toBeLessThan(dragon.x);
    expect(baron.y).toBeGreaterThan(dragon.y);
  });

  it('agrees with the real ELITE_MONSTER_KILL positions in the fixture', () => {
    const kills = timeline.events.filter((e) => e.type === 'ELITE_MONSTER_KILL' && e.position);
    expect(kills.length).toBeGreaterThan(0);
    for (const kill of kills) {
      const nearest = Math.min(
        ...OBJECTIVES.map((o) => Math.hypot(o.x - kill.position.x, o.y - kill.position.y))
      );
      // Generous: a monster can be finished anywhere inside its pit.
      expect(nearest).toBeLessThan(1500);
    }
  });
});

describe('structuresAt', () => {
  it('reports everything standing before the first building falls', () => {
    const state = structuresAt(timeline.events, 0);
    expect(state).toHaveLength(STRUCTURES.length);
    expect(state.every((s) => s.destroyed === false)).toBe(true);
  });

  it('marks a structure destroyed only from its own timestamp onward', () => {
    const kill = buildingKills[0];
    const before = structuresAt(timeline.events, kill.timestamp - 1);
    const after = structuresAt(timeline.events, kill.timestamp);

    expect(before.filter((s) => s.destroyed)).toHaveLength(0);
    const destroyed = after.filter((s) => s.destroyed);
    expect(destroyed).toHaveLength(1);
    expect(destroyed[0].destroyedAtMs).toBe(kill.timestamp);
  });

  it('never destroys more structures than there were building kills', () => {
    const state = structuresAt(timeline.events, Number.MAX_SAFE_INTEGER);
    expect(state.filter((s) => s.destroyed).length).toBeLessThanOrEqual(buildingKills.length);
  });

  // timelineRankedNormal.json is hand-built (see its contract test), so its
  // BUILDING_KILL coordinates are illustrative rather than surveyed — the bot
  // inner turret sits ~880 units off the real one. That is exactly the case
  // the lane/tier fallback exists for, and resolving it correctly proves a
  // synthetic or drifted position cannot silently land on the wrong turret.
  it('resolves every building kill in the fixture to the right structure', () => {
    const state = structuresAt(timeline.events, Number.MAX_SAFE_INTEGER);
    const destroyed = state.filter((s) => s.destroyed).map((s) => s.id).sort();
    expect(destroyed).toEqual(['b-top-outer', 'r-bot-inner']);
  });

  // Riot emits no BUILDING_KILL for a nexus (0 across 40 timelines), and the
  // approximate nexus coordinate sits ~316u from a real nexus turret — inside
  // MATCH_RADIUS. Excluding it from matching is what stops it stealing that
  // turret's kill.
  it('never attributes a building kill to a nexus', () => {
    const state = structuresAt(
      [{ type: 'BUILDING_KILL', timestamp: 1000, position: { x: 1748, y: 2270 } }],
      60000
    );
    expect(state.find((s) => s.id === 'b-nexus-1').destroyed).toBe(true);
    expect(state.find((s) => s.id === 'b-nexus').destroyed).toBe(false);
  });

  it('leaves both nexuses standing even at the end of the game', () => {
    const state = structuresAt(timeline.events, Number.MAX_SAFE_INTEGER);
    expect(state.filter((s) => s.kind === 'NEXUS').every((s) => !s.destroyed)).toBe(true);
  });

  it('ignores non-building events', () => {
    const state = structuresAt(
      [{ type: 'CHAMPION_KILL', timestamp: 1000, position: { x: 981, y: 10441 } }],
      60000
    );
    expect(state.every((s) => s.destroyed === false)).toBe(true);
  });

  it('falls back to lane and tier when a building kill has no position', () => {
    const state = structuresAt(
      [
        {
          type: 'BUILDING_KILL',
          timestamp: 1000,
          teamId: 100,
          buildingType: 'TOWER_BUILDING',
          laneType: 'TOP_LANE',
          towerType: 'OUTER_TURRET',
        },
      ],
      60000
    );
    expect(state.find((s) => s.id === 'b-top-outer').destroyed).toBe(true);
  });

  it('keeps the earliest timestamp when a structure is reported twice', () => {
    const event = (timestamp) => ({
      type: 'BUILDING_KILL',
      timestamp,
      position: { x: 981, y: 10441 },
    });
    const state = structuresAt([event(90000), event(30000)], 120000);
    expect(state.find((s) => s.id === 'b-top-outer').destroyedAtMs).toBe(30000);
  });
});
