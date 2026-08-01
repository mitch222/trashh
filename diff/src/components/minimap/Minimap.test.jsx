import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Minimap } from './Minimap';

const champions = Array.from({ length: 10 }, (_, i) => ({
  participantId: i + 1,
  summonerName: `Player${i + 1}`,
  championName: 'Ahri',
  teamId: i < 5 ? 100 : 200,
  isSupport: i === 4 || i === 9,
  inFountain: false,
  x: 100 + i * 20,
  y: 200,
}));

describe('Minimap', () => {
  // jsdom's getContext('2d') returns null; the canvas layer must bail rather
  // than throw so the surrounding markup is still assertable.
  it('renders without throwing when a 2d canvas context is unavailable', () => {
    expect(() =>
      render(<Minimap champions={champions} ariaLabel="Minimapa de prueba" />)
    ).not.toThrow();
  });

  it('exposes the map with an accessible name', () => {
    render(<Minimap champions={champions} ariaLabel="Minimapa de prueba" />);
    expect(screen.getByRole('img', { name: 'Minimapa de prueba' })).toBeInTheDocument();
  });

  it('renders one dot per champion', () => {
    const { container } = render(<Minimap champions={champions} ariaLabel="m" />);
    const titles = Array.from(container.querySelectorAll('circle title'));
    expect(titles).toHaveLength(10);
  });

  it('gives every event marker an accessible title', () => {
    const markers = [
      { id: 'k1', type: 'CHAMPION_KILL', x: 10, y: 20, label: 'BlueSupport eliminó a RedSupport' },
      { id: 'm1', type: 'ELITE_MONSTER_KILL', x: 30, y: 40, label: 'BlueJungle mató Barón' },
    ];
    const { container } = render(<Minimap champions={[]} markers={markers} ariaLabel="m" />);
    const titles = Array.from(container.querySelectorAll('title')).map((t) => t.textContent);
    expect(titles).toContain('BlueSupport eliminó a RedSupport');
    expect(titles).toContain('BlueJungle mató Barón');
  });

  it('marks fountain samples as near-base rather than claiming the champion was dead', () => {
    const { container } = render(
      <Minimap
        champions={[{ ...champions[0], inFountain: true }]}
        ariaLabel="m"
      />
    );
    const title = container.querySelector('circle title').textContent;
    expect(title).toContain('cerca de la base');
    expect(title).not.toMatch(/muert/i);
  });

  it('refuses to project onto an unsupported map', () => {
    render(<Minimap mapId={12} champions={champions} ariaLabel="m" />);
    expect(screen.getByText(/Mapa no soportado/)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'm' })).not.toBeInTheDocument();
  });
});
