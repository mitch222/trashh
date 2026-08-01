import { describe, it, expect } from 'vitest';
import {
  dedupeWardEvents,
  buildWardWindows,
  activeWardsAt,
  summarizeWards,
  countWardsKilled,
  WARD_DURATION,
  MAX_FINITE_WARD_SECONDS,
} from './wards.js';

const TEAMS = { 1: 100, 2: 100, 3: 100, 4: 100, 5: 100, 6: 200, 7: 200, 8: 200, 9: 200, 10: 200 };
const GAME_MS = 1875000;

const placed = (timestamp, creatorId, wardType) => ({ type: 'WARD_PLACED', timestamp, creatorId, wardType });
const killed = (timestamp, killerId, wardType) => ({ type: 'WARD_KILL', timestamp, killerId, wardType });

const build = (events, extra = {}) =>
  buildWardWindows(events, { gameDurationMs: GAME_MS, teamByParticipantId: TEAMS, ...extra });

describe('dedupeWardEvents', () => {
  it('collapses the duplicate WARD_PLACED events Riot sometimes emits', () => {
    const events = [
      placed(60000, 5, 'YELLOW_TRINKET'),
      placed(60000, 5, 'YELLOW_TRINKET'),
      placed(60000, 10, 'YELLOW_TRINKET'),
    ];
    expect(dedupeWardEvents(events)).toHaveLength(2);
  });

  it('leaves non-placement events untouched', () => {
    const events = [killed(1000, 5, 'CONTROL_WARD'), killed(1000, 5, 'CONTROL_WARD')];
    expect(dedupeWardEvents(events)).toHaveLength(2);
  });
});

describe('buildWardWindows', () => {
  it('gives a trinket an estimated expiry band, never a point', () => {
    const { windows } = build([placed(0, 5, 'YELLOW_TRINKET')]);
    const [w] = windows;
    expect(w.startMs).toBe(0);
    expect(w.endMsMin).toBeLessThan(w.endMsMax);
    expect(w.certainty).toBe('estimated');
    expect(w.endReason).toBe('EXPIRED_ESTIMATED');
  });

  it('leaves control wards open-ended until something closes them', () => {
    const { windows } = build([placed(60000, 5, 'CONTROL_WARD')]);
    expect(windows[0].endReason).toBe('GAME_END');
    expect(windows[0].endMsMax).toBe(GAME_MS);
  });

  it('never claims a duration for ward types whose lifetime is unverified', () => {
    expect(WARD_DURATION.SIGHT_WARD).toBeNull();
    const { windows } = build([placed(60000, 5, 'SIGHT_WARD')]);
    expect(windows[0].certainty).toBe('unknown');
    expect(windows[0].endMsMin).toBeNull();
  });

  it('keeps a ward whose creatorId Riot omitted, unattributed', () => {
    const { windows } = build([{ type: 'WARD_PLACED', timestamp: 60000, wardType: 'YELLOW_TRINKET' }]);
    expect(windows).toHaveLength(1);
    expect(windows[0].creatorId).toBeNull();
    expect(windows[0].teamId).toBeNull();
  });

  it('closes a window with an enemy WARD_KILL, but marks the match as inferred', () => {
    const { windows, unmatchedKills } = build([
      placed(60000, 5, 'CONTROL_WARD'),
      killed(120000, 10, 'CONTROL_WARD'),
    ]);
    expect(windows[0].endReason).toBe('KILLED_MATCHED');
    expect(windows[0].endMsMin).toBe(120000);
    // The timestamp is exact but which ward died is guesswork, so this must
    // never be reported as certain.
    expect(windows[0].certainty).toBe('estimated');
    expect(unmatchedKills).toBe(0);
  });

  it('does not let a team close its own ward', () => {
    const { windows, unmatchedKills } = build([
      placed(60000, 5, 'CONTROL_WARD'),
      killed(120000, 2, 'CONTROL_WARD'), // same team as creator 5
    ]);
    expect(windows[0].endReason).toBe('GAME_END');
    expect(unmatchedKills).toBe(1);
  });

  it('counts a kill with no open candidate as unmatched instead of inventing a ward', () => {
    const { windows, unmatchedKills } = build([killed(120000, 8, 'TEEMO_MUSHROOM')]);
    expect(windows).toHaveLength(0);
    expect(unmatchedKills).toBe(1);
  });

  it('matches FIFO: the earliest still-open ward of that type goes first', () => {
    const { windows } = build([
      placed(60000, 5, 'CONTROL_WARD'),
      placed(90000, 5, 'CONTROL_WARD'),
      killed(120000, 10, 'CONTROL_WARD'),
    ]);
    expect(windows[0].endReason).toBe('KILLED_MATCHED');
    expect(windows[1].endReason).toBe('GAME_END');
  });

  it('narrows the trinket band using the creator level when available', () => {
    const lowLevel = build([placed(0, 5, 'YELLOW_TRINKET')], { levelAt: () => 1 }).windows[0];
    const highLevel = build([placed(0, 5, 'YELLOW_TRINKET')], { levelAt: () => 18 }).windows[0];
    expect(highLevel.endMsMax).toBeGreaterThan(lowLevel.endMsMax);
    // Still a band, not a point — level itself is only sampled once a minute.
    expect(highLevel.endMsMin).toBeLessThan(highLevel.endMsMax);
  });

  it('clamps expiry to the end of the game', () => {
    const { windows } = build([placed(GAME_MS - 5000, 5, 'YELLOW_TRINKET')]);
    expect(windows[0].endMsMax).toBe(GAME_MS);
  });
});

describe('activeWardsAt', () => {
  it('moves a trinket through active -> possiblyActive -> gone', () => {
    // At level 1 the trinket lasts 90s, so the residual band is [90s, 95s].
    const { windows } = build([placed(0, 5, 'YELLOW_TRINKET')], { levelAt: () => 1 });
    expect([windows[0].endMsMin, windows[0].endMsMax]).toEqual([90000, 95000]);

    expect(activeWardsAt(windows, 60000).active).toHaveLength(1);
    expect(activeWardsAt(windows, 92000).possiblyActive).toHaveLength(1);

    const late = activeWardsAt(windows, 100000);
    expect(late.active).toHaveLength(0);
    expect(late.possiblyActive).toHaveLength(0);
  });

  it('keeps an unkilled control ward active for the rest of the game', () => {
    const { windows } = build([placed(60000, 5, 'CONTROL_WARD')]);
    expect(activeWardsAt(windows, 600000).active).toHaveLength(1);
    expect(activeWardsAt(windows, GAME_MS - 1).active).toHaveLength(1);
  });

  it('drops a control ward once a matched kill closes it', () => {
    const { windows } = build([
      placed(60000, 5, 'CONTROL_WARD'),
      killed(120000, 10, 'CONTROL_WARD'),
    ]);
    expect(activeWardsAt(windows, 90000).active).toHaveLength(1);
    expect(activeWardsAt(windows, 150000).active).toHaveLength(0);
  });

  it('never puts an unverified-duration ward in the active bucket', () => {
    const { windows } = build([placed(60000, 5, 'SIGHT_WARD')]);
    const at = activeWardsAt(windows, 90000);
    expect(at.active).toHaveLength(0);
    expect(at.possiblyActive).toHaveLength(0);
    expect(at.unknown).toHaveLength(1);
  });

  it('stops counting an unverified-duration ward once nothing finite could still be up', () => {
    // We never claim when a SIGHT_WARD expired, but past the longest finite
    // ward lifetime in the game it is certainly gone. Without this the
    // unknown bucket grows monotonically and implies a ward placed ten
    // minutes ago might still be active.
    const { windows } = build([placed(0, 5, 'SIGHT_WARD')]);
    expect(activeWardsAt(windows, MAX_FINITE_WARD_SECONDS * 1000).unknown).toHaveLength(1);
    expect(activeWardsAt(windows, MAX_FINITE_WARD_SECONDS * 1000 + 1).unknown).toHaveLength(0);
    expect(activeWardsAt(windows, 600000).unknown).toHaveLength(0);
  });

  it('applies the same bound to UNDEFINED wards, which are common on live data', () => {
    const { windows } = build([placed(0, 5, 'UNDEFINED')]);
    expect(activeWardsAt(windows, 120000).unknown).toHaveLength(1);
    expect(activeWardsAt(windows, 600000).unknown).toHaveLength(0);
  });

  it('ignores wards not yet placed at that instant', () => {
    const { windows } = build([placed(600000, 5, 'CONTROL_WARD')]);
    const at = activeWardsAt(windows, 60000);
    expect(at.active.length + at.possiblyActive.length + at.unknown.length).toBe(0);
  });
});

describe('summarizeWards', () => {
  it('counts per creator and never attributes an unknown-creator ward', () => {
    const { windows } = build([
      placed(10000, 5, 'YELLOW_TRINKET'),
      placed(20000, 5, 'CONTROL_WARD'),
      placed(30000, 10, 'YELLOW_TRINKET'),
      { type: 'WARD_PLACED', timestamp: 40000, wardType: 'YELLOW_TRINKET' },
    ]);

    const summary = summarizeWards(windows, 60000, { creatorIds: [5, 10] });
    expect(summary.placedBy[5]).toBe(2);
    expect(summary.placedBy[10]).toBe(1);
    expect(summary.placedUnknownCreator).toBe(1);
  });

  it('only counts wards placed up to the given instant', () => {
    const { windows } = build([placed(10000, 5, 'YELLOW_TRINKET'), placed(600000, 5, 'CONTROL_WARD')]);
    expect(summarizeWards(windows, 60000, { creatorIds: [5] }).placedBy[5]).toBe(1);
  });
});

describe('countWardsKilled', () => {
  it('counts kill events up to an instant', () => {
    const events = [killed(10000, 5, 'YELLOW_TRINKET'), killed(600000, 10, 'CONTROL_WARD')];
    expect(countWardsKilled(events, 60000)).toBe(1);
    expect(countWardsKilled(events, 700000)).toBe(2);
  });
});
