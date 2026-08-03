/**
 * Accessible name for a champion dot.
 *
 * The fountain suffix says "near base", never "was dead" — proximity is
 * geometry we can verify, death is an inference we cannot.
 *
 * The death suffix is separate and always carries the word "estimado":
 * CHAMPION_KILL gives an exact death, but the respawn is never reported, so
 * whether a champion is still down at this instant is a bounded guess.
 */
const DEATH_SUFFIX = {
  dead: ' · muerto (estimado)',
  possiblyDead: ' · posiblemente muerto (estimado)',
};

export function describeDot(champion) {
  const who = champion.championName
    ? `${champion.summonerName ?? 'Desconocido'} (${champion.championName})`
    : (champion.summonerName ?? 'Desconocido');
  const role = champion.isSupport ? ' · support' : '';
  const fountain = champion.inFountain ? ' · cerca de la base' : '';
  const death = DEATH_SUFFIX[champion.deathState] ?? '';
  return `${who}${role}${fountain}${death}`;
}
