import { describe, it, expect } from 'vitest';
import { eventsInWindow, positionedEvents, describeEvent } from './matchEvents.js';

const NAMES = { 5: 'BlueSupport', 10: 'RedSupport' };

describe('eventsInWindow', () => {
  const events = [
    { type: 'CHAMPION_KILL', timestamp: 59999 },
    { type: 'CHAMPION_KILL', timestamp: 60000 },
    { type: 'CHAMPION_KILL', timestamp: 119999 },
    { type: 'CHAMPION_KILL', timestamp: 120000 },
  ];

  it('is half-open: includes the start, excludes the end', () => {
    const inWindow = eventsInWindow(events, 60000, 120000);
    expect(inWindow.map((e) => e.timestamp)).toEqual([60000, 119999]);
  });

  it('returns an empty array for no events', () => {
    expect(eventsInWindow(null, 0, 60000)).toEqual([]);
  });
});

describe('positionedEvents', () => {
  it('keeps only drawable events', () => {
    const events = [
      { type: 'CHAMPION_KILL', timestamp: 1, position: { x: 1, y: 2 } },
      { type: 'BUILDING_KILL', timestamp: 2, position: { x: 3, y: 4 } },
      // Ward events never carry a position and must never reach the map.
      { type: 'WARD_PLACED', timestamp: 3, creatorId: 5 },
      { type: 'WARD_KILL', timestamp: 4, killerId: 10 },
    ];
    const result = positionedEvents(events);
    expect(result.map((e) => e.type)).toEqual(['CHAMPION_KILL', 'BUILDING_KILL']);
  });

  it('drops a positioned-type event that somehow lacks coordinates', () => {
    expect(positionedEvents([{ type: 'CHAMPION_KILL', timestamp: 1 }])).toEqual([]);
  });
});

describe('describeEvent', () => {
  const opts = { nameByParticipantId: NAMES };

  it('describes combat events with participant names', () => {
    expect(describeEvent({ type: 'CHAMPION_KILL', killerId: 5, victimId: 10 }, opts))
      .toBe('BlueSupport eliminó a RedSupport');
    expect(describeEvent({ type: 'CHAMPION_SPECIAL_KILL', killerId: 5, killType: 'KILL_FIRST_BLOOD' }, opts))
      .toBe('BlueSupport consiguió la primera sangre');
    expect(describeEvent({ type: 'ELITE_MONSTER_KILL', killerId: 10, monsterType: 'BARON_NASHOR' }, opts))
      .toBe('RedSupport mató Barón');
  });

  it('describes ward events without implying a location', () => {
    expect(describeEvent({ type: 'WARD_PLACED', creatorId: 5 }, opts))
      .toBe('BlueSupport colocó una ward');
    expect(describeEvent({ type: 'WARD_KILL', killerId: 10 }, opts))
      .toBe('RedSupport destruyó una ward');
  });

  it('renders an unknown or missing participant as "Desconocido"', () => {
    // Riot ships WARD_PLACED without a creatorId sometimes — that must read
    // as unknown, never as an empty string or an invented name.
    expect(describeEvent({ type: 'WARD_PLACED' }, opts)).toBe('Desconocido colocó una ward');
    expect(describeEvent({ type: 'CHAMPION_KILL', killerId: 99, victimId: 5 }, opts))
      .toBe('Desconocido eliminó a BlueSupport');
    expect(describeEvent({ type: 'CHAMPION_KILL', killerId: 5, victimId: 10 }))
      .toBe('Desconocido eliminó a Desconocido');
  });

  it('falls back to the raw type for anything unmapped', () => {
    expect(describeEvent({ type: 'SOMETHING_NEW' }, opts)).toBe('SOMETHING_NEW');
  });
});
