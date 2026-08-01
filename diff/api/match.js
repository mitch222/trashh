import pLimit from 'p-limit';
import { riotApi, setCorsHeaders, handleOptions, delay } from './utils/api.js';
import { formatMatchData } from './lib/formatMatchData.js';

const CONCURRENCY = 3;
const GLOBAL_TIMEOUT = 9000;

const limit = pLimit(CONCURRENCY);

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
    const { puuid, region, count = 10, start = 0 } = req.query;

    if (!puuid || !region) {
      throw new Error('Parámetros requeridos: puuid y region');
    }

    const effectiveCount = Math.min(Number(count) || 10, 15);
    const effectiveStart = Math.max(Number(start) || 0, 0);

    const matchIds = await getMatchHistory(puuid, region, effectiveCount, effectiveStart);
    const matches = await processMatches(matchIds, region);

    clearTimeout(timeout);
    if (!responded) {
      responded = true;
      // hasMore is about the RAW match id page, not the ranked-only filtered
      // count below: a full page of ids means there may be more history to
      // page into, even if this particular page happened to contain few (or
      // zero) ranked games. The client advances `start` by effectiveCount on
      // every "load more" regardless of how many matches this page yielded,
      // so pagination stays correct even through non-ranked gaps.
      res.status(200).json({
        matches: matches.slice(0, effectiveCount),
        hasMore: matchIds.length === effectiveCount,
      });
    }

  } catch (error) {
    clearTimeout(timeout);
    if (!responded) {
      responded = true;
      res.status(error.response?.status || 500).json({
        error: error.message,
        code: error.response?.status || 'INTERNAL_ERROR'
      });
    }
  }
}

async function getMatchHistory(puuid, region, count, start = 0) {
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
  const { data } = await riotApi.get(url, { params: { count, start } });
  return data;
}

async function processMatches(matchIds, region) {
  const promises = matchIds.map(matchId => 
    limit(async () => {
      try {
        const matchData = await getMatchDetails(matchId, region);
        if (matchData.info.queueId === 420) {
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
    const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
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
