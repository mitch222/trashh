export const REGIONS = [
  { value: 'americas', label: 'Americas (NA, LAN, LAS, BR)' },
  { value: 'europe', label: 'Europe (EUW, EUNE, TR, RU)' },
  { value: 'asia', label: 'Asia (KR, JP)' },
  { value: 'sea', label: 'Sea (OCE, SG, TW, VN)' },
];

export const REGION_PLATFORMS = {
  americas: 'americas.api.riotgames.com',
  europe: 'europe.api.riotgames.com',
  asia: 'asia.api.riotgames.com',
  sea: 'sea.api.riotgames.com',
};

export function platformForRegion(region) {
  return REGION_PLATFORMS[region];
}
