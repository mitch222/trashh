import { ITEM_VERSION } from './items';
import { SUMMONERS_RIFT_MAP_ID } from './mapCoords';

/** Both CDNs serve a 512x512 PNG with Access-Control-Allow-Origin: *. */
export const MINIMAP_SIZE = 512;

/**
 * Data Dragon is the primary source: every other remote asset in this app
 * already comes from it (see items.js), so it adds no new third-party origin,
 * and it is pinned to ITEM_VERSION so the art cannot shift under the app
 * without a deliberate bump.
 */
export function getMinimapUrl(mapId = SUMMONERS_RIFT_MAP_ID) {
  return `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/map/map${mapId}.png`;
}

/**
 * Community Dragon fallback — more current art, but a moving `latest` target
 * on a community mirror, hence second. The geometry (which is what the
 * projection depends on) is identical between the two; only the art differs.
 *
 * Note the plain `2dlevelminimap.png` path 404s; `_base_baron1` is the
 * neutral default variant.
 */
export function getMinimapFallbackUrl(mapId = SUMMONERS_RIFT_MAP_ID) {
  return `https://raw.communitydragon.org/latest/game/assets/maps/info/map${mapId}/2dlevelminimap_base_baron1.png`;
}
