import { z } from 'zod';
import { RiotParticipantSchema } from './riotParticipant.schema.js';

/**
 * Raw Riot match-v5 MatchDto shape (metadata + info), scoped to the
 * fields this app reads.
 */
export const RiotMatchDtoSchema = z
  .object({
    metadata: z
      .object({
        matchId: z.string(),
      })
      .passthrough(),
    info: z
      .object({
        gameDuration: z.number(),
        queueId: z.number(),
        gameMode: z.string(),
        participants: z.array(RiotParticipantSchema),
      })
      .passthrough(),
  })
  .passthrough();

/** @typedef {import('zod').infer<typeof RiotMatchDtoSchema>} RiotMatchDto */
