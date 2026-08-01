/**
 * Picks the support player out of one team's 5 participants.
 *
 * Priority order, from most to least reliable:
 * 1. `teamPosition === 'UTILITY'` — Riot's current, reliable position field.
 * 2. `individualPosition === 'UTILITY'` — fallback when teamPosition is
 *    empty/unresolved but Riot still inferred an individual position.
 * 3. Legacy `role` (`SUPPORT` / `DUO_SUPPORT`) — low-confidence, used only
 *    when neither modern field resolved (e.g. ARAM, some edge-case games).
 *
 * Returns `undefined` when none of the above match, rather than guessing —
 * callers must render an explicit "not identified" state instead of
 * silently picking the wrong player.
 *
 * @param {Array<object>} teamParticipants - the 5 participants on one team
 * @returns {object|undefined}
 */
export function getSupport(teamParticipants) {
  const byTeamPosition = teamParticipants.find((p) => p.teamPosition === 'UTILITY');
  if (byTeamPosition) return byTeamPosition;

  const byIndividualPosition = teamParticipants.find((p) => p.individualPosition === 'UTILITY');
  if (byIndividualPosition) return byIndividualPosition;

  const byLegacyRole = teamParticipants.find(
    (p) => p.role === 'SUPPORT' || p.role === 'DUO_SUPPORT'
  );
  if (byLegacyRole) return byLegacyRole;

  return undefined;
}
