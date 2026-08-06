import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchPlayerByRiotId, fetchMatchHistory } from '../services/riotClient';
import { aggregatePlayerStats } from '../lib/stats';
import { platformForRegion } from '../lib/region';
import { DEFAULT_QUEUE } from '../../shared/queues.js';

const MATCHES_PAGE_SIZE = 10;

/**
 * Drives the player page purely from URL params (region/gameName/tagLine)
 * instead of react-router's in-memory location.state, so a direct/refreshed
 * navigation to /player?... still has everything it needs to fetch data.
 *
 * `queue` is part of the effect's dependencies on purpose: switching queue has
 * to discard the loaded matches and restart paging from zero, because offsets
 * index into Riot's per-queue id list and are meaningless across queues.
 */
export function usePlayerData({ region, gameName, tagLine, queue = DEFAULT_QUEUE }) {
  const [player, setPlayer] = useState(null);
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Raw offset into Riot's match-id list for the selected queue. Riot filters
  // by queue at the source now, so a page normally yields exactly as many
  // matches as ids requested; the offset is still tracked separately from
  // matches.length so a match that fails to fetch cannot shift the window.
  const nextStartRef = useRef(0);
  const puuidRef = useRef(null);

  useEffect(() => {
    if (!region || !gameName || !tagLine) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPlayer(null);
    setMatches(null);
    setHasMore(false);
    nextStartRef.current = 0;
    puuidRef.current = null;

    (async () => {
      try {
        const account = await fetchPlayerByRiotId({ gameName, tagLine, region });
        if (controller.signal.aborted) return;
        const playerData = { ...account, region, platform: platformForRegion(region) };
        setPlayer(playerData);
        puuidRef.current = account.puuid;

        const { matches: firstPage, hasMore: more } = await fetchMatchHistory(
          { puuid: account.puuid, region, count: MATCHES_PAGE_SIZE, start: 0, queue },
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        setMatches(firstPage);
        setHasMore(more);
        nextStartRef.current = MATCHES_PAGE_SIZE;
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [region, gameName, tagLine, queue]);

  const loadMoreMatches = async () => {
    if (loadingMore || !hasMore || !puuidRef.current) return;

    setLoadingMore(true);
    try {
      const { matches: nextPage, hasMore: more } = await fetchMatchHistory({
        puuid: puuidRef.current,
        region,
        count: MATCHES_PAGE_SIZE,
        start: nextStartRef.current,
        queue,
      });
      nextStartRef.current += MATCHES_PAGE_SIZE;
      setHasMore(more);
      setMatches((current) => {
        const existingIds = new Set((current || []).map((m) => m.id));
        const deduped = nextPage.filter((m) => !existingIds.has(m.id));
        return [...(current || []), ...deduped];
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const stats = useMemo(
    () => (matches ? aggregatePlayerStats(matches, gameName) : null),
    [matches, gameName]
  );

  const profileIconId = useMemo(() => {
    if (!matches || matches.length === 0) return null;
    // From the most recent match — a per-game snapshot, not a live lookup
    // (see shared/schemas/match.schema.js).
    const self = matches[0].participants.find((p) => p.summonerName === gameName);
    return self?.profileIconId ?? null;
  }, [matches, gameName]);

  return {
    player,
    matches,
    stats,
    profileIconId,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMoreMatches,
  };
}
