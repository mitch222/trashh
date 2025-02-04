import axios from 'axios';
import pLimit from 'p-limit';

const API_KEY = process.env.VITE_RIOT_API_KEY;
const CONCURRENCY = 3; // Máximo de solicitudes paralelas
const REQUEST_TIMEOUT = 4000; // 4 segundos por solicitud
const GLOBAL_TIMEOUT = 9000; // 9 segundos (deja 1s margen para Vercel)

// Configuración global de Axios
const riotApi = axios.create({
  headers: { 'X-Riot-Token': API_KEY },
  timeout: REQUEST_TIMEOUT
});

// Limitador de concurrencia
const limit = pLimit(CONCURRENCY);

export default async function handler(req, res) {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://trashh.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Timeout global
  const timeout = setTimeout(() => {
    res.status(504).json({ error: 'Timeout excedido', code: 'GLOBAL_TIMEOUT' });
  }, GLOBAL_TIMEOUT);

  try {
    const { puuid, region, count = 10 } = req.query; // Reducido a 10 por defecto
    
    // Validación de parámetros
    if (!puuid || !region) {
      throw new Error('Parámetros requeridos: puuid y region');
    }

    // Obtener historial de partidas
    const matchIds = await getMatchHistory(puuid, region, Math.min(count, 15)); // Limitar máximo
    
    // Procesar en paralelo controlado
    const matches = await processMatches(matchIds, region);
    
    clearTimeout(timeout);
    res.status(200).json(matches.slice(0, count));
    
  } catch (error) {
    clearTimeout(timeout);
    res.status(error.response?.status || 500).json({
      error: error.message,
      code: error.response?.status || 'INTERNAL_ERROR'
    });
  }
}

async function getMatchHistory(puuid, region, count) {
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
  const { data } = await riotApi.get(url, {
    params: { count },
    timeout: REQUEST_TIMEOUT
  });
  return data;
}

async function processMatches(matchIds, region) {
  const matches = [];
  
  const promises = matchIds.map(matchId => 
    limit(async () => {
      try {
        const matchData = await getMatchDetails(matchId, region);
        if (matchData.info.queueId === 420) {
          matches.push(formatMatchData(matchData));
        }
      } catch (error) {
        console.error(`Error en match ${matchId}:`, error.message);
      }
    })
  );

  await Promise.all(promises);
  return matches;
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

function formatMatchData(matchData) {
  return {
    id: matchData.metadata.matchId,
    duration: matchData.info.gameDuration,
    participants: matchData.info.participants.map(p => ({
      champion: p.championName,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      win: p.win
    }))
  };
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));