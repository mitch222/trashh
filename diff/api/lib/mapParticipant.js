/**
 * Maps a raw Riot match-v5 participant into the app's normalized shape.
 *
 * `healingDoneToAllies` and `totalHealSelfInclusive` are intentionally
 * distinct fields (see shared/schemas/match.schema.js) — Riot's own
 * `totalHealsOnTeammates` (ally-only) and `totalHeal` (self-inclusive)
 * are different stats and must never collapse into one alias again.
 *
 * `shieldsGranted` is not a real Riot match-v5 field, so it is not
 * mapped here; the correct ally-shield stat is
 * `totalDamageShieldedOnTeammates`, mapped as `shielding`.
 */
export function mapParticipant(p) {
  return {
    // Deliberately NOT falling back to the array index: this is invoked as
    // `participants.map(mapParticipant)`, so a second parameter would
    // silently start receiving the index. A wrong id would render another
    // champion's timeline movements as this support's — the UI shows an
    // explicit "cannot link" state instead.
    participantId: p.participantId ?? null,
    summonerName: p.riotIdGameName,
    championName: p.championName,
    profileIconId: p.profileIcon ?? null,
    teamId: p.teamId,
    win: p.win,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,

    visionScore: p.visionScore || 0,
    wardsPlaced: p.wardsPlaced || 0,
    wardsDestroyed: p.wardsDestroyed || 0,
    visionWardsBoughtInGame: p.visionWardsBoughtInGame || 0,
    controlWardsPlaced: p.controlWardsPlaced || 0,
    timeCCingOthers: p.timeCCingOthers || 0,

    healingDoneToAllies: p.totalHealsOnTeammates || 0,
    totalHealSelfInclusive: p.totalHeal || 0,
    shielding: p.totalDamageShieldedOnTeammates || 0,

    goldEarned: p.goldEarned || 0,
    goldSpent: p.goldSpent || 0,
    totalDamageDealt: p.totalDamageDealt || 0,
    totalDamageDealtToChampions: p.totalDamageDealtToChampions || 0,
    totalUnitsHealed: p.totalUnitsHealed || 0,
    turretKills: p.turretKills || 0,
    inhibitorKills: p.inhibitorKills || 0,
    objectivesStolen: p.objectivesStolen || 0,
    championLevel: p.championLevel || 0,
    doubleKills: p.doubleKills || 0,
    tripleKills: p.tripleKills || 0,
    quadraKills: p.quadraKills || 0,
    pentakills: p.pentaKills || 0,

    item0: p.item0 ?? null,
    item1: p.item1 ?? null,
    item2: p.item2 ?? null,
    item3: p.item3 ?? null,
    item4: p.item4 ?? null,
    item5: p.item5 ?? null,
    item6: p.item6 ?? null,

    perks: p.perks || {},
    summoner1Id: p.summoner1Id,
    summoner2Id: p.summoner2Id,

    role: p.role,
    lane: p.lane,
    teamPosition: p.teamPosition,
    individualPosition: p.individualPosition,
  };
}
