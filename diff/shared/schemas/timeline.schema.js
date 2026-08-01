import { z } from 'zod';

/**
 * The app's normalized, heavily projected timeline — the shape /api/timeline
 * returns and the single source of truth the minimap consumes.
 *
 * Riot's raw timeline is 567 KB median / 1.97 MB max, almost all of it
 * `championStats`, `damageStats` and per-kill damage breakdowns the UI never
 * shows. This shape keeps only positions, levels and the events that matter.
 *
 * `positions` and `levels` are separate flat records rather than one nested
 * record because their consumers are disjoint: the heatmap only reads
 * positions, the ward uptime estimator only reads levels.
 *
 * As in the raw schema: ward events NEVER carry a position, so `position` is
 * optional here and the minimap must never plot a ward.
 */
/**
 * Bumped when the projected shape changes. The endpoint caches for a year, so
 * the client refuses payloads whose version it does not recognize. Shared by
 * the projector (api/lib) and the consumer hook (src/hooks) so the two cannot
 * disagree about what version they speak.
 */
export const TIMELINE_SCHEMA_VERSION = 1;

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const TimelineFrameSchema = z.object({
  // Authoritative — never re-derive this from frameInterval * index.
  timestamp: z.number(),
  positions: z.record(z.string(), PositionSchema),
  levels: z.record(z.string(), z.number().int()).optional(),
});

export const TimelineEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  position: PositionSchema.optional(),
  killerId: z.number().int().optional(),
  victimId: z.number().int().optional(),
  // Genuinely absent sometimes — Riot has shipped WARD_PLACED without it.
  creatorId: z.number().int().optional(),
  assistingParticipantIds: z.array(z.number().int()).optional(),
  teamId: z.number().int().optional(),
  killerTeamId: z.number().int().optional(),
  wardType: z.string().optional(),
  monsterType: z.string().optional(),
  monsterSubType: z.string().optional(),
  buildingType: z.string().optional(),
  laneType: z.string().optional(),
  towerType: z.string().optional(),
  killType: z.string().optional(),
});

export const TimelineSchema = z.object({
  schemaVersion: z.literal(TIMELINE_SCHEMA_VERSION),
  matchId: z.string(),
  frameInterval: z.number(),
  participants: z.array(
    z.object({
      participantId: z.number().int(),
      puuid: z.string(),
    })
  ),
  frames: z.array(TimelineFrameSchema),
  events: z.array(TimelineEventSchema),
});

/** @typedef {import('zod').infer<typeof TimelineSchema>} Timeline */
/** @typedef {import('zod').infer<typeof TimelineFrameSchema>} TimelineFrame */
/** @typedef {import('zod').infer<typeof TimelineEventSchema>} TimelineEvent */
/** @typedef {import('zod').infer<typeof PositionSchema>} Position */
