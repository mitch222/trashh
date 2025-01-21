import axios from 'axios';

const API_KEY = process.env.VITE_RIOT_API_KEY;

/**
 * @param {string} puuid - PUUID del jugador
 * @param {string} region - Región (e.g. na1, euw1, kr, etc.)
 * @param {number} [count=20] - Número de partidas a obtener
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
 * @param {string} region - Región (e.g. na1, euw1, kr, etc.)
 * @returns {Promise<Object>} - Información de la partida con el ID <code>match_id</code>
 */
async function get_match_details(match_id, region) {
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/${match_id}`;
  const headers = { 'X-Riot-Token': API_KEY };
  const response = await axios.get(url, { headers });
  return response.data;
}

/**
 * @param {string} puuid - PUUID del jugador
 * @param {string} region - Región (e.g. na1, euw1, kr, etc.)
 * @param {number} [count=20] - Número de partidas a obtener
 * @returns {Promise<Array<Object>>} - Lista de partidas de Solo/Dúo con información de los participantes
 */
async function filter_solo_duo_matches(puuid, region, count = 20) {
  const match_ids = await get_match_history(puuid, region, count);
  const match_details_promises = match_ids.map(match_id => get_match_details(match_id, region));
  const match_details = await Promise.all(match_details_promises);

  const solo_duo_matches = match_details
    .filter(match_data => match_data.info.queueId === 420) // Solo/Dúo
    .map(match_data => ({
      matchId: match_data.metadata.matchId,
      participants: match_data.info.participants.map(participant => ({
        summonerName: participant.summonerName,
        championName: participant.championName,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        visionScore: participant.visionScore,
      })),
    }));

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
