import { z } from 'zod';

/**
 * Raw Riot match-v5 ParticipantDto — only the fields this app actually
 * reads are asserted explicitly. `.passthrough()` keeps unknown Riot
 * fields around instead of stripping them, so adding a new stat later
 * doesn't require touching this schema first.
 *
 * `totalHeal` (self-inclusive: lifesteal, jungle monster healing, etc.)
 * and `totalHealsOnTeammates` (ally-only healing) are BOTH real, DIFFERENT
 * Riot fields — the app previously confused them (see match.schema.js).
 */
export const RiotParticipantSchema = z
  .object({
    // Riot's 1-10 index. Required here on purpose: this is the raw schema,
    // whose job is to make Riot contract drift loud. It is also the only key
    // that links a participant to the match timeline, which is keyed
    // exclusively by participantId.
    participantId: z.number().int(),
    riotIdGameName: z.string(),
    championName: z.string(),
    // Summoner icon at the time of THIS match — not a live lookup. Good
    // enough for a profile avatar without adding a platform-routed
    // summoner-v4 call (which would need a real platform like 'kr'/'na1',
    // not the americas/europe/asia/sea continent value this app collects).
    profileIcon: z.number().int().optional(),
    teamId: z.number(),
    win: z.boolean(),
    kills: z.number(),
    deaths: z.number(),
    assists: z.number(),

    visionScore: z.number().default(0),
    wardsPlaced: z.number().default(0),
    wardsDestroyed: z.number().default(0),
    visionWardsBoughtInGame: z.number().default(0),
    controlWardsPlaced: z.number().default(0),
    timeCCingOthers: z.number().default(0),

    totalHealsOnTeammates: z.number().default(0),
    totalHeal: z.number().default(0),
    totalDamageShieldedOnTeammates: z.number().default(0),

    goldEarned: z.number().default(0),
    goldSpent: z.number().default(0),
    totalDamageDealt: z.number().default(0),
    totalDamageDealtToChampions: z.number().default(0),
    totalUnitsHealed: z.number().default(0),
    turretKills: z.number().default(0),
    inhibitorKills: z.number().default(0),
    objectivesStolen: z.number().default(0),
    championLevel: z.number().default(0),
    doubleKills: z.number().default(0),
    tripleKills: z.number().default(0),
    quadraKills: z.number().default(0),
    pentaKills: z.number().default(0),

    item0: z.number().default(0),
    item1: z.number().default(0),
    item2: z.number().default(0),
    item3: z.number().default(0),
    item4: z.number().default(0),
    item5: z.number().default(0),
    item6: z.number().default(0),

    perks: z.record(z.string(), z.any()).optional(),
    summoner1Id: z.number().optional(),
    summoner2Id: z.number().optional(),

    // Legacy, low-confidence position fields — Riot can return 'NONE' or
    // misclassify roaming supports. Kept only as a last-resort fallback.
    role: z.string().optional(),
    lane: z.string().optional(),

    // Current, reliable position fields. Empty string / 'Invalid' when
    // Riot's own inference fails (e.g. some ARAM-like or unusual games).
    teamPosition: z.string().optional(),
    individualPosition: z.string().optional(),
  })
  .passthrough();

/** @typedef {import('zod').infer<typeof RiotParticipantSchema>} RiotParticipant */
