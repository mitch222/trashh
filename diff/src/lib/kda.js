export function formatKDA(kills, deaths, assists) {
  return `${kills} / ${deaths} / ${assists}`;
}

export function getKDAColor(kills, deaths, assists) {
  if (deaths === 0) return 'text-purple-500';
  const kda = (kills + assists) / deaths;
  if (kda >= 5) return 'text-green-500';
  if (kda >= 3) return 'text-blue-500';
  if (kda >= 2) return 'text-yellow-500';
  return 'text-gray-500';
}
