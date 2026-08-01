import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchTimelinePanel } from './MatchTimelinePanel';
import { useMatchTimeline } from '../../hooks/useMatchTimeline';
import { projectTimeline } from '../../../api/lib/projectTimeline.js';
import { formatMatchData } from '../../../api/lib/formatMatchData.js';
import rawTimeline from '../../../api/__fixtures__/timelineRankedNormal.json';
import matchRankedNormal from '../../../api/__fixtures__/matchRankedNormal.json';

vi.mock('../../hooks/useMatchTimeline', () => ({
  useMatchTimeline: vi.fn(),
}));

const match = formatMatchData(matchRankedNormal);
const timeline = projectTimeline(rawTimeline);
const blueSupport = match.participants.find((p) => p.participantId === 5);
const redSupport = match.participants.find((p) => p.participantId === 10);

const renderPanel = (props = {}) =>
  render(
    <MatchTimelinePanel
      match={match}
      region="asia"
      blueSupport={blueSupport}
      redSupport={redSupport}
      {...props}
    />
  );

beforeEach(() => {
  useMatchTimeline.mockReset();
});

describe('MatchTimelinePanel', () => {
  it('shows a skeleton while loading', () => {
    useMatchTimeline.mockReturnValue({ timeline: null, loading: true, error: null });
    const { container } = renderPanel();
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows the error state with a retry', () => {
    useMatchTimeline.mockReturnValue({
      timeline: null,
      loading: false,
      error: 'No se pudo cargar la línea de tiempo de la partida.',
    });
    renderPanel();
    expect(screen.getByText('No se pudo cargar la línea de tiempo de la partida.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('says it cannot link rather than drawing an empty map when no support has an id', () => {
    useMatchTimeline.mockReturnValue({ timeline, loading: false, error: null });
    renderPanel({
      blueSupport: { ...blueSupport, participantId: null },
      redSupport: { ...redSupport, participantId: null },
    });
    expect(screen.getByText(/No se puede vincular la línea de tiempo/)).toBeInTheDocument();
  });

  it('renders the map and the always-visible honesty footnote', () => {
    useMatchTimeline.mockReturnValue({ timeline, loading: false, error: null });
    renderPanel();

    expect(screen.getByRole('img', { name: /Minimapa de la partida/ })).toBeInTheDocument();
    // Not behind a disclosure — must be readable without interaction.
    expect(screen.getByText(/Riot no publica la posición de las wards/)).toBeInTheDocument();
    expect(screen.getByText(/una muestra por campeón cada 60 s/)).toBeInTheDocument();
  });

  it('labels the sampling rate and count instead of implying continuous coverage', () => {
    useMatchTimeline.mockReturnValue({ timeline, loading: false, error: null });
    renderPanel();
    expect(screen.getByText(/Presencia muestreada cada 60 s · 32 muestras/)).toBeInTheDocument();
  });

  it('moves through the game when the scrubber changes', () => {
    useMatchTimeline.mockReturnValue({ timeline, loading: false, error: null });
    renderPanel();

    const slider = screen.getByRole('slider', { name: 'Minuto de la partida' });
    expect(slider).toHaveAttribute('aria-valuetext', '0:00');

    fireEvent.change(slider, { target: { value: '12' } });
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '12:00');
    expect(screen.getByText(/Eventos: 12:00–13:00/)).toBeInTheDocument();
  });

  it('offers the blue / red / both support toggle', () => {
    useMatchTimeline.mockReturnValue({ timeline, loading: false, error: null });
    renderPanel();

    const group = screen.getByRole('group', { name: 'Support a mostrar' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Azul \(Nami\)/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rojo \(Thresh\)/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ambos' }));
    expect(screen.getByRole('button', { name: 'Ambos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps all ten champion dots on the map regardless of the support toggle', () => {
    useMatchTimeline.mockReturnValue({ timeline, loading: false, error: null });
    const { container } = renderPanel();

    const countDots = () => container.querySelectorAll('circle title').length;
    expect(countDots()).toBe(10);

    fireEvent.click(screen.getByRole('button', { name: /Azul \(Nami\)/ }));
    expect(countDots()).toBe(10);
  });

  it('never renders a ward as a map marker', () => {
    useMatchTimeline.mockReturnValue({ timeline, loading: false, error: null });
    const { container } = renderPanel();

    const markerLabels = Array.from(container.querySelectorAll('svg title')).map((t) => t.textContent);
    expect(markerLabels.some((label) => /ward/i.test(label))).toBe(false);
  });
});
