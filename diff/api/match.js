import axios from 'axios';

const API_KEY = process.env.VITE_RIOT_API_KEY;

/**
 * @param {string} puuid - PUUID del jugador
 * @param {string} region - Regi n (e.g. na1, euw1, kr, etc.)
 * @param {number} [count=20] - N mero de partidas a obtener
 * @returns {Promise<Array<string>>} - Lista de IDs de partidas
 */
async function get_match_history(puuid, region, count = 20) {
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
  const params = { start: 0, count: count };
  const headers = { 'X-Riot-Token': API_KEY };
  const response = await axios.get(url, { headers, params });
  return response.data;
}

/**
 * @param {string} match_id - ID de la partida
 * @param {string} region - Regi n (e.g. na1, euw1, kr, etc.)
 * @returns {Promise<Object>} - Informaci n de la partida con el ID <code>match_id</code>
 */
async function get_match_details(match_id, region) {
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${match_id}`;
  const headers = { 'X-Riot-Token': API_KEY };
  const response = await axios.get(url, { headers });
  return response.data;
}

async function filter_solo_duo_matches(puuid, region, count = 20) {
  const match_ids = await get_match_history(puuid, region, count);
  const solo_duo_matches = [];

  for (const match_id of match_ids) {
    const match_data = await get_match_details(match_id, region);
    if (match_data.info.queueId === 420) { // Solo/Dúo
      const participants = match_data.info.participants.map(participant => ({
        summonerName: participant.summonerName,
        championName: participant.championName,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        visionScore: participant.visionScore,
      }));
      solo_duo_matches.push({
        matchId: match_id,
        participants: participants,
      });
    }
  }

  return solo_duo_matches;
}

export default async function handler(req, res) {
  const { puuid, region, count } = req.query;

  try {
    const matches = await filter_solo_duo_matches(puuid, region, count);
    res.status(200).json(matches);
  } catch (error) {
    console.error('Error fetching match data:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data || null,
    });
  }
}
