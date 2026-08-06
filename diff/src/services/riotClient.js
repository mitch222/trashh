import { DEFAULT_QUEUE } from '../../shared/queues.js';

// Relative by default — NOT 'http://localhost:3000'. A hardcoded port broke
// every request the moment `vite` ran on its actual default (5173) instead:
// requests silently hit ERR_CONNECTION_REFUSED with no visible error in the
// UI. A relative path works unconditionally instead: in dev it rides
// vite.config.js's `/api` proxy to production regardless of which port Vite
// picked, and in prod it's already same-origin (frontend + /api functions
// both served from the same Vercel deployment) — no env var required either
// way. VITE_API_URL is still honored for the one case that needs an absolute
// URL: pointing dev at a locally-running `vercel dev` API on another port.
const API_URL = import.meta.env.VITE_API_URL || '';

export async function fetchPlayerByRiotId({ gameName, tagLine, region }) {
  const response = await fetch(
    `${API_URL}/api/player?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${region}`
  );
  if (!response.ok) {
    throw new Error('Jugador no encontrado');
  }
  return response.json();
}

export async function fetchMatchHistory(
  { puuid, region, count = 10, start = 0, queue = DEFAULT_QUEUE },
  { signal } = {}
) {
  const response = await fetch(
    `${API_URL}/api/match?puuid=${puuid}&region=${region}&count=${count}&start=${start}&queue=${encodeURIComponent(queue)}`,
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
