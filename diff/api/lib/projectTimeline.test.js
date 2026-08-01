import { describe, it, expect } from 'vitest';
import { projectTimeline, POSITIONED_EVENT_TYPES, WARD_EVENT_TYPES } from './projectTimeline.js';
import { TimelineSchema } from '../../shared/schemas/timeline.schema.js';
import rawTimeline from '../__fixtures__/timelineRankedNormal.json';
import matchRankedNormal from '../__fixtures__/matchRankedNormal.json';

describe('projectTimeline', () => {
  const result = projectTimeline(rawTimeline);
  const serialized = JSON.stringify(result);

  it('maps top-level fields and validates against the normalized TimelineSchema', () => {
    expect(result.schemaVersion).toBe(1);
    expect(result.matchId).toBe(rawTimeline.metadata.matchId);
    expect(result.participants).toHaveLength(10);
    expect(() => TimelineSchema.parse(result)).not.toThrow();
  });

  it('forwards frameInterval from the response instead of hardcoding 60000', () => {
    expect(result.frameInterval).toBe(rawTimeline.info.frameInterval);

    const doubled = projectTimeline({
      ...rawTimeline,
      info: { ...rawTimeline.info, frameInterval: 120000 },
    });
    expect(doubled.frameInterval).toBe(120000);
  });

  it('reads frame timestamps from the data rather than recomputing them', () => {
    expect(result.frames).toHaveLength(rawTimeline.info.frames.length);
    result.frames.forEach((frame, i) => {
      expect(frame.timestamp).toBe(rawTimeline.info.frames[i].timestamp);
    });
  });

  it('keeps positions keyed by the strings "1".."10"', () => {
    expect(Object.keys(result.frames[0].positions)).toEqual(
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
    );
    const raw = rawTimeline.info.frames[0].participantFrames['5'].position;
    expect(result.frames[0].positions['5']).toEqual({ x: raw.x, y: raw.y });
  });

  it('keeps levels, which the ward uptime estimator needs for trinket scaling', () => {
    expect(result.frames[0].levels['5']).toBe(
      rawTimeline.info.frames[0].participantFrames['5'].level
    );
  });

  it('strips the heavy per-frame stat blocks that dominate the payload', () => {
    // The fixture puts championStats/damageStats on exactly one participantFrame.
    expect(rawTimeline.info.frames[0].participantFrames['1'].championStats).toBeDefined();
    expect(result.frames[0].positions['1'].championStats).toBeUndefined();
    expect(serialized).not.toContain('championStats');
    expect(serialized).not.toContain('damageStats');
    expect(serialized).not.toContain('currentGold');
  });

  it('strips per-kill damage breakdowns, which are large and never displayed', () => {
    expect(serialized).not.toContain('victimDamageDealt');
    expect(serialized).not.toContain('victimDamageReceived');
  });

  it('filters out event types the UI does not use', () => {
    const keptTypes = new Set(result.events.map((e) => e.type));
    for (const noise of ['ITEM_PURCHASED', 'ITEM_DESTROYED', 'LEVEL_UP', 'SKILL_LEVEL_UP', 'GAME_END', 'PAUSE_END']) {
      expect(keptTypes.has(noise)).toBe(false);
    }
  });

  it('keeps every positioned and ward event, and nothing else', () => {
    expect(result.events.length).toBeGreaterThan(0);
    for (const event of result.events) {
      expect(POSITIONED_EVENT_TYPES.has(event.type) || WARD_EVENT_TYPES.has(event.type)).toBe(true);
    }
  });

  it('gives every positioned event a position and no ward event one', () => {
    const positioned = result.events.filter((e) => POSITIONED_EVENT_TYPES.has(e.type));
    const wards = result.events.filter((e) => WARD_EVENT_TYPES.has(e.type));

    expect(positioned.length).toBeGreaterThan(0);
    expect(wards.length).toBeGreaterThan(0);

    for (const event of positioned) expect(event.position).toBeDefined();
    // The premise of the whole feature: Riot exposes no ward coordinates,
    // so the projector must never invent one.
    expect(wards.filter((e) => e.position !== undefined)).toEqual([]);
  });

  it('preserves a WARD_PLACED that arrived without a creatorId', () => {
    const placements = result.events.filter((e) => e.type === 'WARD_PLACED');
    expect(placements.filter((e) => e.creatorId === undefined)).toHaveLength(1);
  });

  it('meaningfully cuts the payload', () => {
    const rawSize = JSON.stringify(rawTimeline).length;
    expect(serialized.length).toBeLessThan(rawSize * 0.55);

    // NOTE: this fixture can only demonstrate a ~2x cut, not the ~12x seen on
    // real data. Real timelines carry championStats + damageStats on all
    // ~320 participantFrames and a victimDamage* breakdown on every kill;
    // this fixture carries them on one frame and one kill respectively,
    // precisely so it stays reviewable at 80 KB instead of 567 KB. The
    // real-world ratio is verified by the smoke test against a live match
    // (see the plan's step 6), not here. What this pin catches is the
    // projection being weakened or removed outright.
  });

  it('composes with matchRankedNormal.json via matchId', () => {
    expect(result.matchId).toBe(matchRankedNormal.metadata.matchId);
  });
});
