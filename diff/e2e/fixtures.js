import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { formatMatchData } from '../api/lib/formatMatchData.js';
import { projectTimeline } from '../api/lib/projectTimeline.js';

// Built live from the same fixtures + mapping functions the unit/contract
// tests use, so these mocks can't silently drift from what the real
// endpoints actually produce.
const readFixture = (name) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../api/__fixtures__/${name}`, import.meta.url)), 'utf-8'));

const rankedFixture = readFixture('matchRankedNormal.json');
const rawTimelineFixture = readFixture('timelineRankedNormal.json');

export const accountFixture = { puuid: 'test-puuid-123', gameName: 'Faker', tagLine: 'KR1' };
export const matchesFixture = [formatMatchData(rankedFixture)];
export const timelineFixture = projectTimeline(rawTimelineFixture);

// The exact /api/match response envelope ({ matches, hasMore }), for routes
// that mock a single, final page of history.
export const matchHistoryResponseFixture = { matches: matchesFixture, hasMore: false };
