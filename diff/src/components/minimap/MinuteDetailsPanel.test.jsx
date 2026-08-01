import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MinuteDetailsPanel } from './MinuteDetailsPanel';

const baseProps = {
  timestamp: 720000,
  frameInterval: 60000,
  events: [
    { type: 'CHAMPION_KILL', timestamp: 725000, killerId: 5, victimId: 10 },
  ],
  wardSummary: {
    totalPlaced: 12,
    placedUnknownCreator: 1,
    killed: 4,
    placedBy: { 5: 7, 10: 4 },
    supports: [
      { participantId: 5, name: 'Nami', teamId: 100, placed: 7 },
      { participantId: 10, name: 'Thresh', teamId: 200, placed: 4 },
    ],
  },
  wardBuckets: { active: [{}, {}, {}], possiblyActive: [{}], unknown: [{}, {}] },
  nameByParticipantId: { 5: 'BlueSupport', 10: 'RedSupport' },
};

describe('MinuteDetailsPanel', () => {
  it('states the instant/window mismatch explicitly', () => {
    render(<MinuteDetailsPanel {...baseProps} />);
    // Positions are an instant, events are a one-minute window — the most
    // misleading thing in the feature, so it must be on screen.
    expect(screen.getByText(/Posiciones:/)).toBeInTheDocument();
    expect(screen.getByText(/Eventos:/)).toBeInTheDocument();
    expect(screen.getByText(/12:00–13:00/)).toBeInTheDocument();
  });

  it('separates facts from estimates and labels the estimate as such', () => {
    render(<MinuteDetailsPanel {...baseProps} />);
    expect(screen.getByText('Hechos')).toBeInTheDocument();
    expect(screen.getByText(/Visión activa \(estimado\)/)).toBeInTheDocument();
  });

  it('never shows an active-ward count without the word "estimado" nearby', () => {
    render(<MinuteDetailsPanel {...baseProps} />);
    const heading = screen.getByText(/Visión activa \(estimado\)/);
    const section = heading.closest('section');
    expect(section).toHaveTextContent('Wards probablemente activas');
    expect(section.textContent).toMatch(/estimado/i);
  });

  it('breaks ward counts down per support, which is the point of the site', () => {
    render(<MinuteDetailsPanel {...baseProps} />);
    expect(screen.getByText('Nami')).toBeInTheDocument();
    expect(screen.getByText('Thresh')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('reports unknown-origin wards separately so they cannot inflate a support count', () => {
    render(<MinuteDetailsPanel {...baseProps} />);
    expect(screen.getByText(/de origen desconocido/)).toBeInTheDocument();
  });

  it('explains why the ward numbers are estimates, including the missing positions', () => {
    render(<MinuteDetailsPanel {...baseProps} />);
    const disclosure = screen.getByText(/¿Por qué es una estimación\?/).closest('details');
    expect(disclosure.textContent).toMatch(/no publica la posición de las wards/);
  });

  it('renders no ward with coordinates', () => {
    const { container } = render(<MinuteDetailsPanel {...baseProps} />);
    // The panel is the only place wards are described; none of it may carry
    // positional markup.
    expect(container.querySelector('svg circle')).toBeNull();
    expect(container.textContent).not.toMatch(/\bx:\s*\d/);
  });

  it('describes the events of the window with participant names', () => {
    render(<MinuteDetailsPanel {...baseProps} />);
    expect(screen.getByText('BlueSupport eliminó a RedSupport')).toBeInTheDocument();
  });

  it('says so when the minute has no events', () => {
    render(<MinuteDetailsPanel {...baseProps} events={[]} />);
    expect(screen.getByText('Sin eventos en este minuto.')).toBeInTheDocument();
  });
});
