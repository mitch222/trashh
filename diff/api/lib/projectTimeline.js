import { RiotTimelineDtoSchema } from '../../shared/schemas/riotTimeline.schema.js';
import { TIMELINE_SCHEMA_VERSION } from '../../shared/schemas/timeline.schema.js';

export { TIMELINE_SCHEMA_VERSION };

/** Events Riot populates with an exact `position`. */
export const POSITIONED_EVENT_TYPES = new Set([
  'CHAMPION_KILL',
  'CHAMPION_SPECIAL_KILL',
  'ELITE_MONSTER_KILL',
  'BUILDING_KILL',
  'TURRET_PLATE_DESTROYED',
]);

/**
 * Ward events, kept for the uptime estimate. These NEVER carry a position —
 * see shared/schemas/riotTimeline.schema.js.
 */
export const WARD_EVENT_TYPES = new Set(['WARD_PLACED', 'WARD_KILL']);

/** The only event fields the UI reads. Everything else is dropped. */
const KEPT_EVENT_FIELDS = [
  'killerId',
  'victimId',
  'creatorId',
  'assistingParticipantIds',
  'teamId',
  'killerTeamId',
  'wardType',
  'monsterType',
  'monsterSubType',
  'buildingType',
  'laneType',
  'towerType',
  'killType',
];

function projectEvent(event) {
  const projected = { type: event.type, timestamp: event.timestamp };

  if (event.position) {
    projected.position = { x: event.position.x, y: event.position.y };
  }

  for (const field of KEPT_EVENT_FIELDS) {
    if (event[field] !== undefined) projected[field] = event[field];
  }

  return projected;
}

function projectFrame(frame) {
  const positions = {};
  const levels = {};

  for (const [key, participantFrame] of Object.entries(frame.participantFrames || {})) {
    if (!participantFrame?.position) continue;
    positions[key] = {
      x: participantFrame.position.x,
      y: participantFrame.position.y,
    };
    if (typeof participantFrame.level === 'number') {
      levels[key] = participantFrame.level;
    }
  }

  return {
    // Authoritative — never synthesized from frameInterval * index.
    timestamp: frame.timestamp,
    positions,
    levels,
  };
}

/**
 * Normalizes a raw Riot match timeline into the app's projected shape.
 *
 * Validates against RiotTimelineDtoSchema first so Riot contract drift shows
 * up as a loud console error instead of a silently wrong map, then proceeds
 * best-effort so one unexpected field doesn't take down the whole panel —
 * same contract as formatMatchData.
 *
 * The projection is the point of this module. Riot's raw timeline is 567 KB
 * median / 1.97 MB max, and `championStats` (27 fields), `damageStats` (12
 * fields) and the per-kill `victimDamage*` arrays are the bulk of it while
 * the UI shows none of it. Dropping them avoids a second full re-serialize
 * in res.json(), keeps the body far under Vercel's 4.5 MB response cap, and
 * collapses the client's transfer and decode cost by roughly 12x.
 *
 * `level` is kept deliberately (~4 KB): it lets the ward uptime estimator
 * interpolate the Stealth Ward's 90->120s level scaling instead of hardcoding
 * one end of the range, so expiry can be shown as an honest interval.
 */
export function projectTimeline(rawTimeline) {
  const parsed = RiotTimelineDtoSchema.safeParse(rawTimeline);
  if (!parsed.success) {
    console.error('Riot match-v5 timeline schema drift detected:', parsed.error.flatten());
  }

  const frames = [];
  const events = [];

  for (const frame of rawTimeline.info.frames) {
    frames.push(projectFrame(frame));

    for (const event of frame.events || []) {
      if (POSITIONED_EVENT_TYPES.has(event.type) || WARD_EVENT_TYPES.has(event.type)) {
        events.push(projectEvent(event));
      }
    }
  }

  return {
    schemaVersion: TIMELINE_SCHEMA_VERSION,
    matchId: rawTimeline.metadata.matchId,
    frameInterval: rawTimeline.info.frameInterval,
    participants: (rawTimeline.info.participants || []).map((p) => ({
      participantId: p.participantId,
      puuid: p.puuid,
    })),
    frames,
    events,
  };
}
