import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePlayerData } from './usePlayerData';
import { fetchPlayerByRiotId, fetchMatchHistory } from '../services/riotClient';

vi.mock('../services/riotClient', () => ({
  fetchPlayerByRiotId: vi.fn(),
  fetchMatchHistory: vi.fn(),
}));

const account = { puuid: 'puuid-1', gameName: 'Faker', tagLine: 'KR1' };

const buildMatch = (id, iconId) => ({
  id,
  participants: [{ summonerName: 'Faker', profileIconId: iconId, win: true, kills: 1, deaths: 1, assists: 1 }],
});

beforeEach(() => {
  vi.clearAllMocks();
  fetchPlayerByRiotId.mockResolvedValue(account);
});

describe('usePlayerData pagination', () => {
  it('fetches the first page with start=0 on mount', async () => {
    fetchMatchHistory.mockResolvedValue({ matches: [buildMatch('M1', 23)], hasMore: true });

    const { result } = renderHook(() =>
      usePlayerData({ region: 'americas', gameName: 'Faker', tagLine: 'KR1' })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMatchHistory).toHaveBeenCalledWith(
      { puuid: 'puuid-1', region: 'americas', count: 10, start: 0, queue: 'solo' },
      expect.anything()
    );
    expect(result.current.matches).toHaveLength(1);
    expect(result.current.hasMore).toBe(true);
  });

  it('advances the raw offset by the page size on loadMoreMatches, appending results', async () => {
    fetchMatchHistory.mockResolvedValueOnce({ matches: [buildMatch('M1', 23)], hasMore: true });
    const { result } = renderHook(() =>
      usePlayerData({ region: 'americas', gameName: 'Faker', tagLine: 'KR1' })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchMatchHistory.mockResolvedValueOnce({ matches: [buildMatch('M2', 23)], hasMore: false });
    await act(async () => {
      await result.current.loadMoreMatches();
    });

    expect(fetchMatchHistory).toHaveBeenLastCalledWith({
      puuid: 'puuid-1', region: 'americas', count: 10, start: 10, queue: 'solo',
    });
    expect(result.current.matches.map((m) => m.id)).toEqual(['M1', 'M2']);
    expect(result.current.hasMore).toBe(false);
  });

  it('does not duplicate a match that appears again in a later page', async () => {
    fetchMatchHistory.mockResolvedValueOnce({ matches: [buildMatch('M1', 23)], hasMore: true });
    const { result } = renderHook(() =>
      usePlayerData({ region: 'americas', gameName: 'Faker', tagLine: 'KR1' })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchMatchHistory.mockResolvedValueOnce({ matches: [buildMatch('M1', 23)], hasMore: false });
    await act(async () => {
      await result.current.loadMoreMatches();
    });

    expect(result.current.matches.map((m) => m.id)).toEqual(['M1']);
  });

  it('ignores loadMoreMatches once hasMore is false', async () => {
    fetchMatchHistory.mockResolvedValueOnce({ matches: [buildMatch('M1', 23)], hasMore: false });
    const { result } = renderHook(() =>
      usePlayerData({ region: 'americas', gameName: 'Faker', tagLine: 'KR1' })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMoreMatches();
    });

    expect(fetchMatchHistory).toHaveBeenCalledTimes(1);
  });

  it('resets pagination when the searched player changes', async () => {
    fetchMatchHistory.mockResolvedValue({ matches: [buildMatch('M1', 23)], hasMore: true });
    const { result, rerender } = renderHook(
      ({ gameName }) => usePlayerData({ region: 'americas', gameName, tagLine: 'KR1' }),
      { initialProps: { gameName: 'Faker' } }
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchPlayerByRiotId.mockResolvedValue({ puuid: 'puuid-2', gameName: 'Other', tagLine: 'KR1' });
    fetchMatchHistory.mockResolvedValue({ matches: [buildMatch('N1', 5)], hasMore: false });
    rerender({ gameName: 'Other' });

    await waitFor(() => expect(result.current.matches?.[0]?.id).toBe('N1'));
    expect(fetchMatchHistory).toHaveBeenLastCalledWith(
      { puuid: 'puuid-2', region: 'americas', count: 10, start: 0, queue: 'solo' },
      expect.anything()
    );
  });
});

describe('usePlayerData profileIconId', () => {
  it('derives the icon from the searched player in the most recent match', async () => {
    fetchMatchHistory.mockResolvedValue({ matches: [buildMatch('M1', 42)], hasMore: false });
    const { result } = renderHook(() =>
      usePlayerData({ region: 'americas', gameName: 'Faker', tagLine: 'KR1' })
    );
    await waitFor(() => expect(result.current.profileIconId).toBe(42));
  });

  it('is null before any match has loaded', () => {
    fetchMatchHistory.mockResolvedValue({ matches: [], hasMore: false });
    const { result } = renderHook(() =>
      usePlayerData({ region: 'americas', gameName: 'Faker', tagLine: 'KR1' })
    );
    expect(result.current.profileIconId).toBeNull();
  });
});

describe('usePlayerData queue filter', () => {
  it('passes the selected queue through to the API', async () => {
    fetchMatchHistory.mockResolvedValue({ matches: [buildMatch('F1', 7)], hasMore: false });

    const { result } = renderHook(() =>
      usePlayerData({ region: 'americas', gameName: 'Faker', tagLine: 'KR1', queue: 'flex' })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMatchHistory).toHaveBeenCalledWith(
      expect.objectContaining({ queue: 'flex', start: 0 }),
      expect.anything()
    );
  });

  // Offsets index into Riot's per-queue id list, so carrying one across a
  // queue change would page into the wrong place and mix two histories.
  it('restarts paging from zero when the queue changes', async () => {
    fetchMatchHistory.mockResolvedValue({ matches: [buildMatch('M1', 1)], hasMore: true });

    const { result, rerender } = renderHook((props) => usePlayerData(props), {
      initialProps: { region: 'americas', gameName: 'Faker', tagLine: 'KR1', queue: 'solo' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMoreMatches();
    });
    expect(fetchMatchHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ queue: 'solo', start: 10 })
    );

    fetchMatchHistory.mockResolvedValue({ matches: [buildMatch('X1', 1)], hasMore: false });
    rerender({ region: 'americas', gameName: 'Faker', tagLine: 'KR1', queue: 'normal' });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMatchHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({ queue: 'normal', start: 0 }),
      expect.anything()
    );
  });

  // Switching queue must not leave the previous queue's games on screen.
  it('discards the previous queue\'s matches on switch', async () => {
    fetchMatchHistory.mockResolvedValue({ matches: [buildMatch('SOLO1', 1)], hasMore: false });

    const { result, rerender } = renderHook((props) => usePlayerData(props), {
      initialProps: { region: 'americas', gameName: 'Faker', tagLine: 'KR1', queue: 'solo' },
    });
    await waitFor(() => expect(result.current.matches).toHaveLength(1));
    expect(result.current.matches[0].id).toBe('SOLO1');

    fetchMatchHistory.mockResolvedValue({ matches: [buildMatch('FLEX1', 1)], hasMore: false });
    rerender({ region: 'americas', gameName: 'Faker', tagLine: 'KR1', queue: 'flex' });

    await waitFor(() => expect(result.current.matches?.[0]?.id).toBe('FLEX1'));
    expect(result.current.matches).toHaveLength(1);
  });

  it('defaults to ranked solo when no queue is given', async () => {
    fetchMatchHistory.mockResolvedValue({ matches: [], hasMore: false });
    const { result } = renderHook(() =>
      usePlayerData({ region: 'americas', gameName: 'Faker', tagLine: 'KR1' })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMatchHistory).toHaveBeenCalledWith(
      expect.objectContaining({ queue: 'solo' }),
      expect.anything()
    );
  });
});
