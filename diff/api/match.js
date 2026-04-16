import pLimit from 'p-limit';
import { riotApi, setCorsHeaders, handleOptions, delay } from './utils/api.js';

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
    const { puuid, region, count = 10 } = req.query;
    
    if (!puuid || !region) {
      throw new Error('Parámetros requeridos: puuid y region');
    }

    const matchIds = await getMatchHistory(puuid, region, Math.min(count, 15));
    const matches = await processMatches(matchIds, region);
    
    clearTimeout(timeout);
    if (!responded) {
      responded = true;
      res.status(200).json(matches.slice(0, count));
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

async function getMatchHistory(puuid, region, count) {
  const url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`;
  const { data } = await riotApi.get(url, { params: { count } });
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
      healing: p.totalHealsOnTeammates || 0,
      healingDoneToAllies: p.totalHealsOnTeammates || 0,
      shielding: p.totalDamageShieldedOnTeammates || 0,
      shieldsGranted: p.shieldsGranted || 0,
      goldEarned: p.goldEarned || 0,
      goldSpent: p.goldSpent || 0,
      totalDamageDealt: p.totalDamageDealt || 0,
      totalDamageDealtToChampions: p.totalDamageDealtToChampions || 0,
      totalHeal: p.totalHeal || 0,
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