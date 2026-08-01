import { useEffect, useState } from 'react';
import { fetchMatchTimeline } from '../services/riotClient';
import { TIMELINE_SCHEMA_VERSION } from '../../shared/schemas/timeline.schema.js';

/**
 * Match timelines are immutable once a game ends, so results are memoised for
 * the life of the page: collapsing and re-expanding a match must not refetch.
 * Capped so a long match history can't grow the cache without bound.
 */
const cache = new Map();
const MAX_CACHED = 10;

function readCache(key) {
  return cache.get(key) ?? null;
}

function writeCache(key, value) {
  if (cache.size >= MAX_CACHED) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, value);
}

/** Exported for tests that need a clean slate between cases. */
export function clearTimelineCache() {
  cache.clear();
}

/**
 * Lazily fetches one match's projected timeline.
 *
 * `enabled` is what makes the fetch opt-in: the panel is only mounted once the
 * user selects the minimap tab, so expanding a match to read KDAs costs
 * nothing.
 *
 * @param {{matchId: string, region: string, enabled?: boolean}} args
 * @returns {{timeline: object|null, loading: boolean, error: string|null}}
 */
export function useMatchTimeline({ matchId, region, enabled = false }) {
  const cacheKey = `${region}:${matchId}`;
  const [timeline, setTimeline] = useState(() => (enabled ? readCache(cacheKey) : null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !matchId || !region) {
      setLoading(false);
      return;
    }

    const cached = readCache(cacheKey);
    if (cached) {
      setTimeline(cached);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await fetchMatchTimeline({ matchId, region }, { signal: controller.signal });
        if (controller.signal.aborted) return;

        // The endpoint caches for a year, so a stale body can outlive a shape
        // change. Refuse anything this build doesn't understand rather than
        // rendering it wrong.
        if (data?.schemaVersion !== TIMELINE_SCHEMA_VERSION) {
          setError('Formato de línea de tiempo no reconocido');
          return;
        }

        writeCache(cacheKey, data);
        setTimeline(data);
      } catch (err) {
        // Unlike usePlayerData, an abort here does not clear an already
        // loaded timeline: matchId is stable, so there is nothing stale to
        // discard.
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [matchId, region, enabled, cacheKey]);

  return { timeline, loading, error };
}
