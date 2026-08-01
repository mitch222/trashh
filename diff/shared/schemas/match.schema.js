import { z } from 'zod';

/**
 * The app's normalized participant shape — the single source of truth
 * both `formatMatchData` (api/lib) and every consumer/test validate
 * against.
 *
 * `healingDoneToAllies` (ally-only healing, from Riot's totalHealsOnTeammates)
 * and `totalHealSelfInclusive` (raw healing incl. self/lifesteal, from
 * Riot's totalHeal) are kept as two clearly-named, distinct fields on
 * purpose — the app used to alias them under confusingly similar names
 * (`healing` / `totalHeal`), which caused wrong numbers to show up in the
 * UI (see MatchItem support card and PlayerPage aggregate stats).
 */
export const ParticipantSchema = z.object({
  /**
   * Riot's 1-10 participant index — the ONLY key that links a participant to
   * their positions in the match timeline, which is keyed exclusively by
   * participantId.
   *
   * Nullable here while the raw schema requires it. The asymmetry is
   * deliberate: raw = required so contract drift is loud, normalized =
   * nullable so a hypothetical omission degrades into an explicit
   * "no se puede vincular" state instead of the app guessing an index.
   */
  participantId: z.number().int().nullable(),
  summonerName: z.string(),
  championName: z.string(),
  // From Riot's per-match `profileIcon` — this player's summoner icon AS OF
  // this game, not a live value. Nullable for the same reason as
  // participantId: an absent id degrades to "no avatar" rather than a guess.
  profileIconId: z.number().int().nullable(),
  teamId: z.number(),
  win: z.boolean(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),

  visionScore: z.number(),
  wardsPlaced: z.number(),
  wardsDestroyed: z.number(),
  visionWardsBoughtInGame: z.number(),
  controlWardsPlaced: z.number(),
  timeCCingOthers: z.number(),

  healingDoneToAllies: z.number(),
  totalHealSelfInclusive: z.number(),
  shielding: z.number(),

  goldEarned: z.number(),
  goldSpent: z.number(),
  totalDamageDealt: z.number(),
  totalDamageDealtToChampions: z.number(),
  totalUnitsHealed: z.number(),
  turretKills: z.number(),
  inhibitorKills: z.number(),
  objectivesStolen: z.number(),
  championLevel: z.number(),
  doubleKills: z.number(),
  tripleKills: z.number(),
  quadraKills: z.number(),
  pentakills: z.number(),

  item0: z.number().nullable(),
  item1: z.number().nullable(),
  item2: z.number().nullable(),
  item3: z.number().nullable(),
  item4: z.number().nullable(),
  item5: z.number().nullable(),
  item6: z.number().nullable(),

  perks: z.record(z.string(), z.any()),
  summoner1Id: z.number().optional(),
  summoner2Id: z.number().optional(),

  // Legacy fallback fields, forwarded as-is.
  role: z.string().optional(),
  lane: z.string().optional(),
  // Current, reliable position fields — used by src/lib/support.js to
  // pick the support player. Empty/undefined when Riot's own inference
  // failed for that game.
  teamPosition: z.string().optional(),
  individualPosition: z.string().optional(),
});

export const MatchSchema = z.object({
  id: z.string(),
  duration: z.number(),
  queueId: z.number(),
  gameMode: z.string(),
  participants: z.array(ParticipantSchema),
});

/** @typedef {import('zod').infer<typeof ParticipantSchema>} Participant */
/** @typedef {import('zod').infer<typeof MatchSchema>} Match */
