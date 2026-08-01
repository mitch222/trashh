import { RiotMatchDtoSchema } from '../../shared/schemas/riotMatch.schema.js';
import { mapParticipant } from './mapParticipant.js';

/**
 * Normalizes a raw Riot match-v5 response into the app's Match shape.
 *
 * Validates against RiotMatchDtoSchema first so that a Riot API field
 * rename/removal shows up as a loud console error instead of a silently
 * wrong stat somewhere in the UI (the original bug class this module
 * exists to prevent). Mapping still proceeds best-effort on validation
 * failure so a single unexpected field doesn't take down match history.
 */
export function formatMatchData(matchData) {
  const parsed = RiotMatchDtoSchema.safeParse(matchData);
  if (!parsed.success) {
    console.error('Riot match-v5 schema drift detected:', parsed.error.flatten());
  }

  return {
    id: matchData.metadata.matchId,
    duration: matchData.info.gameDuration,
    queueId: matchData.info.queueId,
    gameMode: matchData.info.gameMode,
    participants: matchData.info.participants.map(mapParticipant),
  };
}
