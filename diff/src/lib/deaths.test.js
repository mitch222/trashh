import { describe, it, expect } from 'vitest';
import {
  buildDeathWindows,
  deathStateAt,
  BASE_RESPAWN_SECONDS,
  MAX_RESPAWN_INCREASE,
} from './deaths';

const kill = (victimId, timestamp) => ({ type: 'CHAMPION_KILL', victimId, timestamp });

describe('buildDeathWindows', () => {
  it('takes the death timestamp straight from the event', () => {
    const [window] = buildDeathWindows([kill(3, 60000)]);
    expect(window.deathMs).toBe(60000);
    expect(window.participantId).toBe(3);
  });

  it('always reports the respawn as an estimate, never as a fact', () => {
    const windows = buildDeathWindows([kill(3, 60000)], { levelAt: () => 6 });
    expect(windows.every((w) => w.certainty === 'estimated')).toBe(true);
  });

  it('bounds the respawn by the level base wait and the maximum increase', () => {
    const [window] = buildDeathWindows([kill(3, 0)], { levelAt: () => 6 });
    const base = BASE_RESPAWN_SECONDS[6];
    expect(window.respawnMsMin).toBe(base * 1000);
    expect(window.respawnMsMax).toBe(base * (1 + MAX_RESPAWN_INCREASE) * 1000);
  });

  it('widens the band across the whole level range when the level is unknown', () => {
    const [known] = buildDeathWindows([kill(3, 0)], { levelAt: () => 6 });
    const [unknown] = buildDeathWindows([kill(3, 0)]);

    expect(unknown.levelKnown).toBe(false);
    expect(unknown.respawnMsMin).toBeLessThanOrEqual(known.respawnMsMin);
    expect(unknown.respawnMsMax).toBeGreaterThan(known.respawnMsMax);
  });

  it('ignores non-kill events and kills with no resolvable victim', () => {
    const windows = buildDeathWindows([
      { type: 'WARD_PLACED', timestamp: 1000, creatorId: 3 },
      { type: 'CHAMPION_KILL', timestamp: 2000 },
      { type: 'CHAMPION_KILL', timestamp: 3000, victimId: null },
    ]);
    expect(windows).toHaveLength(0);
  });
});

describe('deathStateAt', () => {
  const windows = buildDeathWindows([kill(3, 60000)], { levelAt: () => 6 });
  const base = BASE_RESPAWN_SECONDS[6] * 1000;

  it('says nothing about a champion before they died', () => {
    expect(deathStateAt(windows, 59000)).toEqual({});
  });

  it('is confident while no respawn is possible yet', () => {
    expect(deathStateAt(windows, 60000 + base - 1)).toEqual({ 3: 'dead' });
  });

  it('downgrades to possiblyDead inside the uncertainty band', () => {
    expect(deathStateAt(windows, 60000 + base + 1)).toEqual({ 3: 'possiblyDead' });
  });

  it('drops the claim entirely once the band has passed', () => {
    const past = 60000 + base * (1 + MAX_RESPAWN_INCREASE) + 1;
    expect(deathStateAt(windows, past)).toEqual({});
  });

  it('uses the most recent death when a champion died more than once', () => {
    const twice = buildDeathWindows([kill(3, 10000), kill(3, 100000)], { levelAt: () => 6 });
    expect(deathStateAt(twice, 100000 + 1000)).toEqual({ 3: 'dead' });
  });

  it('tracks each participant independently', () => {
    const many = buildDeathWindows([kill(3, 60000), kill(7, 60000)], { levelAt: () => 6 });
    expect(deathStateAt(many, 61000)).toEqual({ 3: 'dead', 7: 'dead' });
  });
});
