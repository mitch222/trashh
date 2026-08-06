import axios from 'axios';

export const API_KEY = process.env.RIOT_API_KEY;
export const REQUEST_TIMEOUT = 4000;

export const riotApi = axios.create({
  headers: { 'X-Riot-Token': API_KEY },
  timeout: REQUEST_TIMEOUT,
});

/**
 * Origins allowed to call this API from a browser.
 *
 * Kept in sync with vercel.json by hand is not good enough, so vercel.json no
 * longer sets Access-Control-Allow-Origin at all — this is the single source
 * of truth. A static header there could only ever name one origin, and naming
 * two (space separated) is invalid CORS that every browser rejects.
 */
export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://trashh.vercel.app',
];

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // The allowed origin varies per request, so a shared CDN must not serve one
  // caller's ACAO to another. Mandatory alongside the Cache-Control headers
  // the handlers set.
  res.setHeader('Vary', 'Origin');
}

/**
 * Answers a CORS preflight.
 *
 * Reads `req.method` — the previous version checked `res.method`, which is
 * always undefined, so preflights were never actually short-circuited and fell
 * through into the handler body.
 */
export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * Only ever accept GET (and the preflight handled above). Returns true when it
 * has already answered.
 */
export function rejectNonGet(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ error: 'Método no permitido', code: 'METHOD_NOT_ALLOWED' });
    return true;
  }
  return false;
}

/** A 400 carrying a machine-readable code, safe to show the caller. */
export function badRequest(message, code) {
  return Object.assign(new Error(message), { status: 400, code });
}

/** Upstream statuses that are safe to mirror back to the caller. */
const SAFE_STATUSES = new Set([400, 403, 404, 415, 429]);

/**
 * Sends an error without leaking anything about our infrastructure.
 *
 * Handlers used to return `error.message` plus Riot's raw `error.response.data`
 * to the browser. An axios message embeds the full upstream URL, and Riot's
 * payload is upstream detail the client has no use for — together they hand a
 * prospective attacker a map of the backend. The real error still reaches the
 * server logs; the client gets a status and a generic message.
 */
export function sendError(res, error, fallbackMessage) {
  const upstream = error.status || error.response?.status;
  const status = SAFE_STATUSES.has(upstream) ? upstream : 500;

  console.error('[api]', error.code || status, error.message);

  // `error.status` is only set by our own badRequest(), so its `code` is one
  // we chose and is safe to publish. Anything else is an upstream/axios error
  // whose code (e.g. ERR_BAD_REQUEST) would advertise our HTTP client, so
  // those fall back to a generic per-status code.
  const ours = typeof error.status === 'number';
  const code = ours && error.code ? error.code : STATUS_CODES[status];

  const message =
    status === 404
      ? 'No encontrado.'
      : status === 429
        ? 'Demasiadas solicitudes. Probá de nuevo en un momento.'
        : ours && status === 400
          ? (error.message ?? 'Solicitud inválida.')
          : fallbackMessage;

  res.status(status).json({ error: message, code });
}

const STATUS_CODES = {
  400: 'BAD_REQUEST',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
};

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
