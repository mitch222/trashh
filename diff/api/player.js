import { riotApi, setCorsHeaders, handleOptions, delay } from './utils/api.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (handleOptions(res)) return;

  const { gameName, tagLine, region } = req.query;

  if (!gameName || !tagLine || !region) {
    return res.status(400).json({
      error: 'Missing required parameters: gameName, tagLine, region',
      example: '/api/player?gameName=YourName&tagLine=YourTag&region=americas'
    });
  }

  try {
    const summoner = await getSummonerByRiotId(gameName, tagLine, region);
    return res.status(200).json(summoner);
  } catch (error) {
    console.error(`Error fetching player data: ${error.message}`);
    return res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
}

async function getSummonerByRiotId(gameName, tagLine, region, retries = 2) {
  try {
    const url = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
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