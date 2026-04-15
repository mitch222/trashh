import axios from 'axios';
import pLimit from 'p-limit';

const API_KEY = process.env.RIOT_API_KEY;
const CONCURRENCY = 3;
const REQUEST_TIMEOUT = 4000;
const GLOBAL_TIMEOUT = 9000;

const riotApi = axios.create({
  headers: { 'X-Riot-Token': API_KEY },
  timeout: REQUEST_TIMEOUT
});

const limit = pLimit(CONCURRENCY);

export default async function handler(req, res) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://trashh.vercel.app'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const timeout = setTimeout(() => {
    res.status(504).json({ error: 'Timeout excedido', code: 'GLOBAL_TIMEOUT' });
  }, GLOBAL_TIMEOUT);

  try {
    const { puuid, region, count = 10 } = req.query;
    
    if (!puuid || !region) {
      throw new Error('Parámetros requeridos: puuid y region');
    }

    const matchIds = await getMatchHistory(puuid, region, Math.min(count, 15));
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
    queueId: matchData.info.queueId,
    gameMode: matchData.info.gameMode,
    participants: matchData.info.participants.map(p => ({
      summonerName: p.riotIdGameName,
      championName: p.championName,
      teamId: p.teamId,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      win: p.win,
      visionScore: p.visionScore || 0,
      
      wardsPlaced: p.wardsPlaced || 0,
      wardsDestroyed: p.wardsDestroyed || 0,
      visionWardsBoughtInGame: p.visionWardsBoughtInGame || 0,
      controlWardsPlaced: p.controlWardsPlaced || 0,
      
      timeCCingOthers: p.timeCCingOthers || 0,
      
      healing: p.healing || 0,
      healingDoneToAllies: p.healingDoneToAllies || 0,
      shielding: p.totalDamageShieldedOnTeammates || 0,
      shieldsGranted: p.shieldsGranted || 0,
      
      goldEarned: p.goldEarned || 0,
      goldSpent: p.goldSpent || 0,
      totalDamageDealt: p.totalDamageDealt || 0,
      totalDamageDealtToChampions: p.totalDamageDealtToChampions || 0,
      totalHeal: p.totalHealsOnTeammates || 0,
      totalUnitsHealed: p.totalUnitsHealed || 0,
      
      turretKills: p.turretKills || 0,
      inhibitorKills: p.inhibitorKills || 0,
      objectivesStolen: p.objectivesStolen || 0,
      
      championLevel: p.championLevel || 0,
      doubleKills: p.doubleKills || 0,
      tripleKills: p.tripleKills || 0,
      quadraKills: p.quadraKills || 0,
      pentakills: p.pentaKills || 0,
      
      item0: p.item0,
      item1: p.item1,
      item2: p.item2,
      item3: p.item3,
      item4: p.item4,
      item5: p.item5,
      item6: p.item6,
      
      perks: p.perks || {},
      summoner1Id: p.summoner1Id,
      summoner2Id: p.summoner2Id,
      role: p.role,
      lane: p.lane,
    }))
  };
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
