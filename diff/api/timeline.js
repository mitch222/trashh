import {
  riotApi,
  setCorsHeaders,
  handleOptions,
  rejectNonGet,
  delay,
  sendError,
  badRequest,
} from './utils/api.js';
import { projectTimeline } from './lib/projectTimeline.js';
import { isValidRegion, isValidMatchId, riotUrl } from '../shared/riotInput.js';

const GLOBAL_TIMEOUT = 9000;
// The timeline payload is 7-13x a match response (567 KB median, 1.97 MB max),
// so it needs more headroom than utils/api.js's 4000ms default.
const TIMELINE_REQUEST_TIMEOUT = 7000;
const MAX_CONTENT_LENGTH = 8 * 1024 * 1024;

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
    const { matchId, region } = req.query;

    if (!matchId || !region) {
      throw badRequest('Parámetros requeridos: matchId y region', 'BAD_REQUEST');
    }
    // Both values are interpolated into the Riot URL and `region` lands in the
    // hostname, so they are validated rather than trusted. The rules live in
    // shared/riotInput.js so all three endpoints enforce the same ones.
    if (!isValidMatchId(matchId)) {
      throw badRequest('matchId inválido', 'INVALID_MATCH_ID');
    }
    if (!isValidRegion(region)) {
      throw badRequest('Región inválida', 'INVALID_REGION');
    }

    const rawTimeline = await getMatchTimeline(matchId, region, controller.signal);
    const timeline = projectTimeline(rawTimeline);

    clearTimeout(timeout);
    if (!responded) {
      responded = true;
      // Timelines are immutable once a game ends. The browser cache is kept
      // short while the CDN cache is long: a CDN entry is scoped per
      // deployment so a shape change is invalidated by redeploy, but a
      // browser holding a year-old body across a shape change is not (the
      // client also guards on schemaVersion).
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=31536000, immutable');
      // MANDATORY alongside the cache headers: setCorsHeaders emits a
      // per-origin Access-Control-Allow-Origin, and caching that on a shared
      // CDN without Vary poisons it — whichever origin warms the entry would
      // dictate the ACAO every other origin receives.
      res.setHeader('Vary', 'Origin');
      res.status(200).json(timeline);
    }
  } catch (error) {
    clearTimeout(timeout);
    if (!responded) {
      responded = true;
      sendError(res, error, 'No se pudo cargar la línea de tiempo.');
    }
  }
}


async function getMatchTimeline(matchId, region, signal, retries = 1) {
  try {
    const url = riotUrl(
      region,
      `/lol/match/v5/matches/${encodeURIComponent(matchId)}/timeline`
    );
    const { data } = await riotApi.get(url, {
      signal,
      timeout: TIMELINE_REQUEST_TIMEOUT,
      maxContentLength: MAX_CONTENT_LENGTH,
      headers: { 'Accept-Encoding': 'gzip' },
    });
    return data;
  } catch (error) {
    // Only one retry: a 2 MB response does not fit twice inside the 9s budget.
    if (error.response?.status === 429 && retries > 0) {
      const retryAfter = (error.response.headers['retry-after'] || 1) * 1000;
      await delay(retryAfter);
      return getMatchTimeline(matchId, region, signal, retries - 1);
    }
    throw error;
  }
}
