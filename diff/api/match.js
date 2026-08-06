import pLimit from 'p-limit';
import {
  riotApi,
  setCorsHeaders,
  handleOptions,
  rejectNonGet,
  delay,
  sendError,
  badRequest,
} from './utils/api.js';
import { formatMatchData } from './lib/formatMatchData.js';
import { DEFAULT_QUEUE, isValidQueue, queueIdFor, QUEUE_KEYS } from '../shared/queues.js';
import { isValidRegion, isValidPuuid, isValidMatchId, riotUrl } from '../shared/riotInput.js';

const CONCURRENCY = 3;
const GLOBAL_TIMEOUT = 9000;

const limit = pLimit(CONCURRENCY);

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (handleOptions(req, res)) return;
  if (rejectNonGet(req, res)) return;

  let responded = false;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    if (!responded) {
      responded = true;
      controller.abort();
      res.status(504).json({ error: 'Timeout excedido', code: 'GLOBAL_TIMEOUT' });
    }
  }, GLOBAL_TIMEOUT);

  try {
    const { puuid, region, count = 10, start = 0, queue = DEFAULT_QUEUE } = req.query;

    if (!puuid || !region) {
      throw badRequest('Parámetros requeridos: puuid y region', 'BAD_REQUEST');
    }
    // `region` becomes the hostname and `puuid` a path segment, so both are
    // validated before any URL exists. See shared/riotInput.js.
    if (!isValidRegion(region)) {
      throw badRequest('Región inválida', 'INVALID_REGION');
    }
    if (!isValidPuuid(puuid)) {
      throw badRequest('puuid inválido', 'INVALID_PUUID');
    }
    // Validated here rather than forwarded: Riot answers an unknown queue id
    // with 200 and an empty array, so passing a typo through would look like
    // an empty match history instead of a bad request.
    if (!isValidQueue(queue)) {
      throw badRequest(`Cola inválida. Opciones: ${QUEUE_KEYS.join(', ')}`, 'INVALID_QUEUE');
    }

    const effectiveCount = Math.min(Number(count) || 10, 15);
    const effectiveStart = Math.max(Number(start) || 0, 0);
    const queueId = queueIdFor(queue);

    const matchIds = await getMatchHistory(puuid, region, effectiveCount, effectiveStart, queueId);
    const matches = await processMatches(matchIds, region, queueId);

    clearTimeout(timeout);
    if (!responded) {
      responded = true;
      // Riot now filters by queue itself, so an id page contains only matches
      // of the requested queue and hasMore is exact — a full page means there
      // is more history in this queue. This also stops the app downloading
      // full match details just to discard them, which is what the old
      // fetch-everything-then-keep-420 approach did.
      // Finished matches never change, so this page is safe to cache. The CDN
      // holds it far longer than the browser: under a traffic spike the same
      // few players get looked up repeatedly, and each cache hit is a Riot
      // request that never happens.
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600');
      res.status(200).json({
        matches: matches.slice(0, effectiveCount),
        hasMore: matchIds.length === effectiveCount,
        queue,
      });
    }

  } catch (error) {
    clearTimeout(timeout);
    if (!responded) {
      responded = true;
      sendError(res, error, 'No se pudo obtener el historial de partidas.');
    }
  }
}

async function getMatchHistory(puuid, region, count, start = 0, queueId) {
  const url = riotUrl(region, `/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids`);
  const { data } = await riotApi.get(url, { params: { count, start, queue: queueId } });
  return data;
}

async function processMatches(matchIds, region, queueId) {
  const promises = matchIds.map(matchId =>
    limit(async () => {
      try {
        const matchData = await getMatchDetails(matchId, region);
        // Belt and braces: Riot already filtered by queue, but a match whose
        // queue disagrees would break the minimap's map-11 assumption, so it
        // is dropped rather than rendered wrong.
        if (matchData.info.queueId === queueId) {
          return formatMatchData(matchData);
        }
      } catch (error) {
        console.error(`Error en match ${matchId}:`, error.message);
      }
    })
  );

  const results = await Promise.all(promises);
  return results.filter(Boolean);
}

async function getMatchDetails(matchId, region, retries = 2) {
  try {
    // Ids come from Riot's own response rather than the caller, but they are
    // still checked before entering a URL — an upstream that starts returning
    // something unexpected must not become an injection point.
    if (!isValidMatchId(matchId)) {
      throw badRequest('matchId inválido', 'INVALID_MATCH_ID');
    }
    const url = riotUrl(region, `/lol/match/v5/matches/${encodeURIComponent(matchId)}`);
    const { data } = await riotApi.get(url);
    return data;
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      const retryAfter = (error.response.headers['retry-after'] || 1) * 1000;
      await delay(retryAfter);
      return getMatchDetails(matchId, region, retries - 1);
    }
    throw error;
  }
}
