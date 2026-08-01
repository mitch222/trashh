import { z } from 'zod';

/**
 * Raw Riot match-v5 match TIMELINE response.
 *
 * LOAD-BEARING FACT, verified across 3,025 ward events in 21 real timelines:
 * `WARD_PLACED` and `WARD_KILL` carry NO `position`. They have only `type`,
 * `timestamp`, `creatorId`/`killerId` and `wardType`. Riot removed ward
 * coordinates from the API deliberately, and there is no identifier linking a
 * destroyed ward back to the ward that was placed. Nothing in this app may
 * plot a ward spatially.
 *
 * That is why `RiotTimelineEventSchema` asserts only `type` + `timestamp` and
 * passes the rest through: making `position` required would make every ward
 * event fail validation, and modelling it as an optional field on a
 * discriminated union would invite someone to "fill in" the missing case.
 */
export const RiotPositionSchema = z
  .object({
    x: z.number(),
    y: z.number(),
  })
  .passthrough();

export const RiotParticipantFrameSchema = z
  .object({
    participantId: z.number().int(),
    position: RiotPositionSchema,
    level: z.number().int().optional(),
  })
  .passthrough();

export const RiotTimelineEventSchema = z
  .object({
    type: z.string(),
    timestamp: z.number(),
  })
  .passthrough();

export const RiotTimelineFrameSchema = z
  .object({
    timestamp: z.number(),
    // An OBJECT keyed by the strings "1".."10" — not an array.
    participantFrames: z.record(z.string(), RiotParticipantFrameSchema),
    events: z.array(RiotTimelineEventSchema),
  })
  .passthrough();

export const RiotTimelineDtoSchema = z
  .object({
    metadata: z
      .object({
        matchId: z.string(),
      })
      .passthrough(),
    info: z
      .object({
        frameInterval: z.number(),
        participants: z.array(
          z
            .object({
              participantId: z.number().int(),
              puuid: z.string(),
            })
            .passthrough()
        ),
        frames: z.array(RiotTimelineFrameSchema),
      })
      .passthrough(),
  })
  .passthrough();

/** @typedef {import('zod').infer<typeof RiotTimelineDtoSchema>} RiotTimelineDto */
