import { riotApi, setCorsHeaders, handleOptions, delay, sendError } from './utils/api.js';
import {
  isValidRegion,
  isValidGameName,
  isValidTagLine,
  riotUrl,
} from '../shared/riotInput.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (handleOptions(req, res)) return;

  const { gameName, tagLine, region } = req.query;

  if (!gameName || !tagLine || !region) {
    return res.status(400).json({
      error: 'Faltan parámetros requeridos: gameName, tagLine, region',
      code: 'BAD_REQUEST',
    });
  }

  // `region` lands in the hostname and the Riot ID lands in the path, so both
  // are validated before any URL is built. See shared/riotInput.js for the
  // SSRF this prevents.
  if (!isValidRegion(region)) {
    return res.status(400).json({ error: 'Región inválida', code: 'INVALID_REGION' });
  }
  if (!isValidGameName(gameName) || !isValidTagLine(tagLine)) {
    return res.status(400).json({ error: 'Riot ID inválido', code: 'INVALID_RIOT_ID' });
  }

  try {
    const summoner = await getSummonerByRiotId(gameName, tagLine, region);

    // A Riot ID -> puuid mapping effectively never changes, and under a
    // traffic spike this is the request every visitor makes first. Caching it
    // at the CDN keeps repeat lookups off Riot's rate limit entirely.
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
    res.setHeader('Vary', 'Origin');
    return res.status(200).json(summoner);
  } catch (error) {
    return sendError(res, error, 'No se pudo obtener el jugador.');
  }
}

async function getSummonerByRiotId(gameName, tagLine, region, retries = 2) {
  try {
    const url = riotUrl(
      region,
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    );
    const { data } = await riotApi.get(url);
    return data;
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      const retryAfter = (error.response.headers['retry-after'] || 1) * 1000;
      await delay(retryAfter);
      return getSummonerByRiotId(gameName, tagLine, region, retries - 1);
    }
    throw error;
  }
}
