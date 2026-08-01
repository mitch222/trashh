import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlayerPage from './PlayerPage';
import { usePlayerData } from './hooks/usePlayerData';
import { ITEM_VERSION } from './lib/items';

vi.mock('./hooks/usePlayerData', () => ({
  usePlayerData: vi.fn(),
}));

const baseStats = {
  winRate: '64.0', kda: '3.20', games: 10, wins: 6,
  kills: 20, deaths: 25, assists: 150,
  visionScore: 450, avgVision: '45.0',
  wardsPlaced: 80, avgWardsPlaced: '8.0',
  wardsDestroyed: 20, avgWardsDestroyed: '2.0',
  visionWardsBought: 15, controlWardsPlaced: 15,
  timeCCingOthers: 600,
  totalHealSelfInclusive: 90000, avgHealing: 9000,
  healingDoneToAllies: 70000,
  shielding: 30000,
  goldEarned: 70000, avgGold: 7000,
  damageDealt: 90000,
};

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/player" element={<PlayerPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PlayerPage', () => {
  it('shows the empty state when required URL params are missing', () => {
    usePlayerData.mockReturnValue({ matches: null, stats: null, loading: false, error: null });
    renderAt('/player');

    expect(screen.getByText('No se encontraron datos del jugador.')).toBeInTheDocument();
  });

  it('renders aggregated stats driven purely by URL params', () => {
    usePlayerData.mockReturnValue({
      matches: [],
      stats: {
        winRate: '64.0', kda: '3.20', games: 10, wins: 6,
        kills: 20, deaths: 25, assists: 150,
        visionScore: 450, avgVision: '45.0',
        wardsPlaced: 80, avgWardsPlaced: '8.0',
        wardsDestroyed: 20, avgWardsDestroyed: '2.0',
        visionWardsBought: 15, controlWardsPlaced: 15,
        timeCCingOthers: 600,
        totalHealSelfInclusive: 90000, avgHealing: 9000,
        healingDoneToAllies: 70000,
        shielding: 30000,
        goldEarned: 70000, avgGold: 7000,
        damageDealt: 90000,
      },
      loading: false,
      error: null,
    });

    renderAt('/player?region=americas&gameName=Faker&tagLine=KR1');

    expect(screen.getByText('Faker')).toBeInTheDocument();
    expect(screen.getByText('64.0%')).toBeInTheDocument();
  });

  it('shows the fetch error state driven by usePlayerData', () => {
    usePlayerData.mockReturnValue({ matches: null, stats: null, loading: false, error: 'Jugador no encontrado' });
    renderAt('/player?region=americas&gameName=Faker&tagLine=KR1');

    expect(screen.getByText('Jugador no encontrado')).toBeInTheDocument();
  });
});

describe('PlayerPage summoner icon', () => {
  it('renders the real summoner icon when a profileIconId is available', () => {
    usePlayerData.mockReturnValue({
      matches: [], stats: baseStats, profileIconId: 23, loading: false, error: null,
    });
    renderAt('/player?region=americas&gameName=Faker&tagLine=KR1');

    const icon = screen.getByAltText('Ícono de invocador de Faker');
    expect(icon).toHaveAttribute(
      'src',
      `https://ddragon.leagueoflegends.com/cdn/${ITEM_VERSION}/img/profileicon/23.png`
    );
  });

  it('falls back to the placeholder avatar when there is no icon id yet', () => {
    usePlayerData.mockReturnValue({
      matches: [], stats: baseStats, profileIconId: null, loading: false, error: null,
    });
    renderAt('/player?region=americas&gameName=Faker&tagLine=KR1');

    expect(screen.queryByAltText('Ícono de invocador de Faker')).not.toBeInTheDocument();
  });

  it('falls back to the placeholder if the real icon fails to load', () => {
    usePlayerData.mockReturnValue({
      matches: [], stats: baseStats, profileIconId: 23, loading: false, error: null,
    });
    renderAt('/player?region=americas&gameName=Faker&tagLine=KR1');

    fireEvent.error(screen.getByAltText('Ícono de invocador de Faker'));
    expect(screen.queryByAltText('Ícono de invocador de Faker')).not.toBeInTheDocument();
  });
});

describe('PlayerPage load more matches', () => {
  it('shows a "Cargar más partidas" button when there is more history', () => {
    usePlayerData.mockReturnValue({
      matches: [], stats: baseStats, loading: false, error: null,
      hasMore: true, loadingMore: false, loadMoreMatches: vi.fn(),
    });
    renderAt('/player?region=americas&gameName=Faker&tagLine=KR1');

    expect(screen.getByRole('button', { name: 'Cargar más partidas' })).toBeInTheDocument();
  });

  it('hides the button once there is nothing left to load', () => {
    usePlayerData.mockReturnValue({
      matches: [], stats: baseStats, loading: false, error: null,
      hasMore: false, loadingMore: false, loadMoreMatches: vi.fn(),
    });
    renderAt('/player?region=americas&gameName=Faker&tagLine=KR1');

    expect(screen.queryByRole('button', { name: 'Cargar más partidas' })).not.toBeInTheDocument();
  });

  it('calls loadMoreMatches when clicked and disables itself while loading', () => {
    const loadMoreMatches = vi.fn();
    usePlayerData.mockReturnValue({
      matches: [], stats: baseStats, loading: false, error: null,
      hasMore: true, loadingMore: false, loadMoreMatches,
    });
    renderAt('/player?region=americas&gameName=Faker&tagLine=KR1');

    fireEvent.click(screen.getByRole('button', { name: 'Cargar más partidas' }));
    expect(loadMoreMatches).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state and disables the button while fetching the next page', () => {
    usePlayerData.mockReturnValue({
      matches: [], stats: baseStats, loading: false, error: null,
      hasMore: true, loadingMore: true, loadMoreMatches: vi.fn(),
    });
    renderAt('/player?region=americas&gameName=Faker&tagLine=KR1');

    const button = screen.getByRole('button', { name: 'Cargando...' });
    expect(button).toBeDisabled();
  });
});
