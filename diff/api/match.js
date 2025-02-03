import axios from 'axios';

const API_KEY = process.env.VITE_RIOT_API_KEY;

// Configuración global de Axios
axios.defaults.headers.common['X-Riot-Token'] = API_KEY;

async function getMatchHistory(puuid, region, count = 20) {
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
  const params = { start: 0, count: count };
  const response = await axios.get(url, { params });
  return response.data;
}

async function getMatchDetails(matchId, region, retries = 3) {
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      const retryAfter = parseInt(error.response.headers['retry-after'], 10) || 1;
      console.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds...`);
      await delay(retryAfter * 1000);
      return getMatchDetails(matchId, region, retries - 1);
    } else {
      console.error(`Error fetching match details for ${matchId}:`, error.message);
      throw error;
    }
  }
}

async function filterSoloDuoMatches(puuid, region, count = 20) {
  const matchIds = await getMatchHistory(puuid, region, count);
  const matches = [];
  
  for (const matchId of matchIds) {
    try {
      const matchData = await getMatchDetails(matchId, region);
      if (matchData.info.queueId === 420) {
        matches.push({
          metadata: matchData.metadata,
          info: matchData.info
        });
      }
      await delay(1000); // Añade un retraso de 1 segundo entre las solicitudes
    } catch (error) {
      console.error(`Error in match ${matchId}:`, error.message);
    }
  }
  console.log(`Matches found: ${matches.length}`);
  return matches;
}

export default async function handler(req, res) {
  const { puuid, region, count = 20 } = req.query;
  console.log(`Fetching matches for ${puuid} in ${region}`);
  try {
    const matches = await filterSoloDuoMatches(puuid, region, count);
    console.log(`Matches fetched successfully: ${matches.length}`);
    res.status(200).json(matches);
  } catch (error) {
    console.error(`Error in handler: ${error.message}`);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}