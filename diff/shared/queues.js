/**
 * The match queues this app can analyse, and the Riot queue id behind each.
 *
 * Shared by the API and the client so a filter the UI can offer is always one
 * the API accepts — the two cannot drift apart.
 *
 * Every id here is a Summoner's Rift (map 11) queue, which is deliberate: the
 * minimap projection is calibrated for map 11 only (see lib/mapCoords.js) and
 * the support role does not exist in Arena or ARAM. Notably Riot's own
 * `type=normal` filter is NOT usable for "normals" — verified against a live
 * account, it returns Arena games (queueId 1750, mapId 30, gameMode CHERRY),
 * which would render as "Mapa no soportado".
 *
 * Blind Pick (430) and Quickplay (490) are absent because both return zero
 * results on live accounts — Riot retired them on Summoner's Rift. Each filter
 * therefore maps to exactly ONE queue id, which keeps pagination exact: two
 * merged id lists would have to be re-sorted per page and could duplicate or
 * skip matches across pages.
 */
export const QUEUES = {
  solo: { id: 420, label: 'Clasificatoria Solo/Dúo' },
  flex: { id: 440, label: 'Clasificatoria Flexible' },
  normal: { id: 400, label: 'Normal (Draft)' },
};

/** The filter used when none is given — preserves the app's original behaviour. */
export const DEFAULT_QUEUE = 'solo';

export const QUEUE_KEYS = Object.keys(QUEUES);

/**
 * Resolves a filter key to its Riot queue id, or null if unknown.
 *
 * Callers MUST reject a null rather than passing the value through to Riot:
 * `/matches/by-puuid/{puuid}/ids?queue=999` answers 200 with an empty array,
 * not an error, so an unvalidated typo would surface as "this player has no
 * matches" instead of a bad request.
 */
export function queueIdFor(key) {
  return QUEUES[key]?.id ?? null;
}

export function isValidQueue(key) {
  return Object.prototype.hasOwnProperty.call(QUEUES, key);
}
