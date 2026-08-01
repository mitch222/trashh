/**
 * Accessible name for a champion dot.
 *
 * The fountain suffix says "near base", never "was dead" — proximity is
 * geometry we can verify, death is an inference we cannot.
 */
export function describeDot(champion) {
  const who = champion.championName
    ? `${champion.summonerName ?? 'Desconocido'} (${champion.championName})`
    : (champion.summonerName ?? 'Desconocido');
  const role = champion.isSupport ? ' · support' : '';
  const fountain = champion.inFountain ? ' · cerca de la base' : '';
  return `${who}${role}${fountain}`;
}
