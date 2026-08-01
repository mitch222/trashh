import { riotApi, setCorsHeaders, handleOptions, delay } from './utils/api.js';
import { projectTimeline } from './lib/projectTimeline.js';

const GLOBAL_TIMEOUT = 9000;
// The timeline payload is 7-13x a match response (567 KB median, 1.97 MB max),
// so it needs more headroom than utils/api.js's 4000ms default.
const TIMELINE_REQUEST_TIMEOUT = 7000;
const MAX_CONTENT_LENGTH = 8 * 1024 * 1024;

const MATCH_ID_PATTERN = /^[A-Z0-9]{2,5}_\d{6,}$/;
const ROUTING_REGIONS = new Set(['americas', 'asia', 'europe', 'sea']);

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (handleOptions(res)) return;

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
    // hostname, so they are validated rather than trusted.
    if (!MATCH_ID_PATTERN.test(matchId)) {
      throw badRequest('matchId inválido', 'INVALID_MATCH_ID');
    }
    if (!ROUTING_REGIONS.has(region)) {
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
      res.status(error.status || error.response?.status || 500).json({
        error: error.message,
        code: error.code || error.response?.status || 'INTERNAL_ERROR',
      });
    }
  }
}

function badRequest(message, code) {
  const error = new Error(message);
  error.status = 400;
  error.code = code;
  return error;
}

async function getMatchTimeline(matchId, region, signal, retries = 1) {
  try {
    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`;
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
