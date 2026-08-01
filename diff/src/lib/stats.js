/**
 * Aggregates a player's stats across their match history.
 *
 * `totalHealSelfInclusive` (raw healing incl. self/lifesteal) and
 * `healingDoneToAllies` (ally-only healing) are summed independently —
 * they used to collapse into the same number because both read from a
 * single `healing` field on the backend. See api/lib/mapParticipant.js.
 *
 * @param {Array<object>} matches - normalized Match objects
 * @param {string} gameName - the searched player's summonerName to match against
 * @returns {object|null}
 */
export function aggregatePlayerStats(matches, gameName) {
  if (!matches || matches.length === 0) return null;

  const totals = matches.reduce(
    (acc, match) => {
      const player = match.participants.find((p) => p.summonerName === gameName);
      if (!player) return acc;

      return {
        games: acc.games + 1,
        wins: acc.wins + (player.win ? 1 : 0),
        kills: acc.kills + player.kills,
        deaths: acc.deaths + player.deaths,
        assists: acc.assists + player.assists,
        visionScore: acc.visionScore + (player.visionScore || 0),
        wardsPlaced: acc.wardsPlaced + (player.wardsPlaced || 0),
        wardsDestroyed: acc.wardsDestroyed + (player.wardsDestroyed || 0),
        visionWardsBought: acc.visionWardsBought + (player.visionWardsBoughtInGame || 0),
        controlWardsPlaced: acc.controlWardsPlaced + (player.controlWardsPlaced || 0),
        timeCCingOthers: acc.timeCCingOthers + (player.timeCCingOthers || 0),
        totalHealSelfInclusive: acc.totalHealSelfInclusive + (player.totalHealSelfInclusive || 0),
        healingDoneToAllies: acc.healingDoneToAllies + (player.healingDoneToAllies || 0),
        shielding: acc.shielding + (player.shielding || 0),
        goldEarned: acc.goldEarned + (player.goldEarned || 0),
        damageDealt: acc.damageDealt + (player.totalDamageDealtToChampions || 0),
      };
    },
    {
      games: 0, wins: 0, kills: 0, deaths: 0, assists: 0,
      visionScore: 0, wardsPlaced: 0, wardsDestroyed: 0,
      visionWardsBought: 0, controlWardsPlaced: 0, timeCCingOthers: 0,
      totalHealSelfInclusive: 0, healingDoneToAllies: 0, shielding: 0,
      goldEarned: 0, damageDealt: 0,
    }
  );

  const winRate = totals.games > 0 ? ((totals.wins / totals.games) * 100).toFixed(1) : 0;
  const kda = totals.deaths > 0
    ? ((totals.kills + totals.assists) / totals.deaths).toFixed(2)
    : (totals.kills + totals.assists).toFixed(2);
  const avgVision = totals.games > 0 ? (totals.visionScore / totals.games).toFixed(1) : 0;
  const avgWardsPlaced = totals.games > 0 ? (totals.wardsPlaced / totals.games).toFixed(1) : 0;
  const avgWardsDestroyed = totals.games > 0 ? (totals.wardsDestroyed / totals.games).toFixed(1) : 0;
  const avgHealing = totals.games > 0 ? Math.round(totals.totalHealSelfInclusive / totals.games) : 0;
  const avgGold = totals.games > 0 ? Math.round(totals.goldEarned / totals.games) : 0;

  return {
    ...totals, winRate, kda, avgVision, avgWardsPlaced, avgWardsDestroyed,
    avgHealing, avgGold,
  };
}
