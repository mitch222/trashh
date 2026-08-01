import { describe, it, expect } from 'vitest';
import {
  extractPositionSeries,
  projectSeries,
  blobRadiusForSize,
  frameIndexAtTimestamp,
  buildTeamLookup,
  buildNameLookup,
} from './heatmap.js';
import { projectTimeline } from '../../api/lib/projectTimeline.js';
import { formatMatchData } from '../../api/lib/formatMatchData.js';
import rawTimeline from '../../api/__fixtures__/timelineRankedNormal.json';
import matchRankedNormal from '../../api/__fixtures__/matchRankedNormal.json';

const timeline = projectTimeline(rawTimeline);
const match = formatMatchData(matchRankedNormal);

describe('extractPositionSeries', () => {
  it('returns one sample per frame for a participant present throughout', () => {
    const series = extractPositionSeries(timeline, 5);
    expect(series).toHaveLength(timeline.frames.length);
    expect(series[0].position).toEqual(timeline.frames[0].positions['5']);
  });

  it('reads timestamps from the frame rather than recomputing them', () => {
    const series = extractPositionSeries(timeline, 5);
    series.forEach((sample) => {
      expect(sample.timestamp).toBe(timeline.frames[sample.frameIndex].timestamp);
    });
  });

  it('carries the level through for the ward uptime estimator', () => {
    const series = extractPositionSeries(timeline, 5);
    expect(series[0].level).toBe(timeline.frames[0].levels['5']);
  });

  it('returns an empty series instead of throwing for missing inputs', () => {
    expect(extractPositionSeries(null, 5)).toEqual([]);
    expect(extractPositionSeries(timeline, null)).toEqual([]);
    expect(extractPositionSeries(timeline, undefined)).toEqual([]);
    expect(extractPositionSeries(timeline, 99)).toEqual([]);
  });

  it('skips frames missing the participant rather than zero-filling them', () => {
    const gapped = {
      ...timeline,
      frames: timeline.frames.map((frame, i) =>
        i === 2 ? { ...frame, positions: {} } : frame
      ),
    };
    const series = extractPositionSeries(gapped, 5);
    expect(series).toHaveLength(timeline.frames.length - 1);
    // A zero-fill would have put a sample at the map origin.
    expect(series.some((s) => s.position.x === 0 && s.position.y === 0)).toBe(false);
  });
});

describe('projectSeries', () => {
  it('projects every sample into the image box', () => {
    const series = extractPositionSeries(timeline, 5);
    const projected = projectSeries(series, { width: 512, height: 512, teamId: 100 });

    expect(projected).toHaveLength(series.length);
    projected.forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(512);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(512);
    });
  });

  it('flags fountain samples so the heatmap can discount them', () => {
    const projected = projectSeries(
      [{ frameIndex: 0, timestamp: 0, position: { x: 400, y: 460 } }],
      { width: 512, height: 512, teamId: 100 }
    );
    expect(projected[0].inFountain).toBe(true);
  });

  it('drops samples for an unsupported map instead of misprojecting them', () => {
    const projected = projectSeries(
      [{ frameIndex: 0, timestamp: 0, position: { x: 5000, y: 5000 } }],
      { width: 512, height: 512, mapId: 12, teamId: 100 }
    );
    expect(projected).toEqual([]);
  });
});

describe('blobRadiusForSize', () => {
  it('scales with the rendered size', () => {
    expect(blobRadiusForSize(512)).toBeCloseTo(43.52, 2);
    expect(blobRadiusForSize(1024)).toBeCloseTo(blobRadiusForSize(512) * 2, 6);
  });
});

describe('frameIndexAtTimestamp', () => {
  it('finds the frame at or before a timestamp', () => {
    expect(frameIndexAtTimestamp(timeline, 0)).toBe(0);
    expect(frameIndexAtTimestamp(timeline, 60000)).toBe(1);
    expect(frameIndexAtTimestamp(timeline, 95000)).toBe(1);
    expect(frameIndexAtTimestamp(timeline, 120000)).toBe(2);
  });

  it('degrades to 0 for an empty timeline', () => {
    expect(frameIndexAtTimestamp(null, 60000)).toBe(0);
    expect(frameIndexAtTimestamp({ frames: [] }, 60000)).toBe(0);
  });
});

describe('participant lookups', () => {
  it('maps participantId to team and name from normalized match data', () => {
    expect(buildTeamLookup(match.participants)[5]).toBe(100);
    expect(buildTeamLookup(match.participants)[10]).toBe(200);
    expect(buildNameLookup(match.participants)[5]).toBe('BlueSupport');
    expect(buildNameLookup(match.participants)[10]).toBe('RedSupport');
  });

  it('skips participants Riot gave no id rather than guessing an index', () => {
    const withNulls = [
      { participantId: null, teamId: 100, summonerName: 'Unlinkable' },
      { participantId: 5, teamId: 100, summonerName: 'Fine' },
    ];
    expect(Object.keys(buildTeamLookup(withNulls))).toEqual(['5']);
    expect(Object.values(buildNameLookup(withNulls))).not.toContain('Unlinkable');
  });
});
