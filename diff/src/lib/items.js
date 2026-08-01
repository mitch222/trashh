// Data Dragon patch version used for every champion/item/profile-icon/map
// asset URL in this app. Kept current by .github/workflows/update-ddragon-version.yml,
// which opens a PR whenever Riot ships a new one — see that file for how it
// verifies the new version's assets actually exist before bumping this.
export const ITEM_VERSION = '16.15.1';

export function getItemIcon(itemId) {
  if (!itemId || itemId === 0) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/item/${itemId}.png`;
}

export function getChampionIconUrl(championName) {
  return `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/champion/${championName}.png`;
}

export function getChampionIconFallbackUrl() {
  return `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/champion/Ahri.png`;
}

/**
 * `profileIconId` is nullable (see shared/schemas/match.schema.js) — 0 is a
 * real icon id, so it must not be treated as falsy here.
 */
export function getProfileIconUrl(profileIconId) {
  if (profileIconId === null || profileIconId === undefined) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/profileicon/${profileIconId}.png`;
}
