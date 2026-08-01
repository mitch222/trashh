const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function fetchPlayerByRiotId({ gameName, tagLine, region }) {
  const response = await fetch(
    `${API_URL}/api/player?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`
  );
  if (!response.ok) {
    throw new Error('Jugador no encontrado');
  }
  return response.json();
}

export async function fetchMatchHistory({ puuid, region, count = 10, start = 0 }, { signal } = {}) {
  const response = await fetch(
    `${API_URL}/api/match?puuid=${puuid}&region=${region}&count=${count}&start=${start}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('Error fetching match data.');
  }
  // { matches: Match[], hasMore: boolean }
  return response.json();
}

export async function fetchMatchTimeline({ matchId, region }, { signal } = {}) {
  const response = await fetch(
    `${API_URL}/api/timeline?matchId=${encodeURIComponent(matchId)}&region=${encodeURIComponent(region)}`,
    { signal }
  );
  if (!response.ok) {
    throw new Error('No se pudo cargar la línea de tiempo de la partida.');
  }
  return response.json();
}
