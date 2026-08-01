import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchItem from './MatchItem';
import { formatMatchData } from '../api/lib/formatMatchData.js';
import matchRankedNormal from '../api/__fixtures__/matchRankedNormal.json';
import matchNoPositionDataAtAll from '../api/__fixtures__/matchNoPositionDataAtAll.json';

const expand = () => fireEvent.click(screen.getByRole('button', { name: 'Ver detalles de la partida' }));

describe('MatchItem support comparison card', () => {
  it('shows ally-only healing, never the self-inclusive total', () => {
    const match = formatMatchData(matchRankedNormal);
    render(<MatchItem match={match} playerName="BlueSupport" />);
    expand();

    // BlueSupport fixture: totalHealsOnTeammates=7400, totalHeal=9200.
    expect(screen.getByText('7,400')).toBeInTheDocument();
    // The self-inclusive total must not leak into this card at all — that
    // leak was the original aliasing bug's fingerprint. formatMatchData.test.js
    // pins that the two stay distinct at the mapping layer.
    expect(screen.queryByText('9,200')).not.toBeInTheDocument();
  });

  it('shows time spent CCing per support', () => {
    const match = formatMatchData(matchRankedNormal);
    render(<MatchItem match={match} playerName="BlueSupport" />);
    expand();

    // 38s (blue) and 52s (red) — distinct per support, so this also proves
    // the values aren't being read off one shared object.
    // NOTE: assert with the 's' suffix, never bare '38' — RedSupport's
    // visionScore is also 38 and renders as its own element.
    expect(screen.getByText('38s')).toBeInTheDocument();
    expect(screen.getByText('52s')).toBeInTheDocument();
  });

  it('shows "Support no identificado" instead of guessing when no position signal resolves', () => {
    const match = formatMatchData(matchNoPositionDataAtAll);
    render(<MatchItem match={match} playerName="NoPosBlue1" />);
    expand();

    expect(screen.getAllByText('Support no identificado').length).toBeGreaterThan(0);
  });
});

describe('MatchItem expanded tabs', () => {
  const match = formatMatchData(matchRankedNormal);

  it('shows nothing until the row is expanded', () => {
    render(<MatchItem match={match} playerName="BlueSupport" region="asia" />);
    expect(screen.queryByRole('button', { name: 'Minimapa' })).not.toBeInTheDocument();
  });

  it('defaults to the supports comparison', () => {
    render(<MatchItem match={match} playerName="BlueSupport" region="asia" />);
    expand();
    expect(screen.getByText('Comparación de Supports')).toBeInTheDocument();
  });

  it('swaps the comparison for the minimap when that tab is selected', () => {
    render(<MatchItem match={match} playerName="BlueSupport" region="asia" />);
    expand();

    fireEvent.click(screen.getByRole('button', { name: 'Minimapa' }));
    expect(screen.queryByText('Comparación de Supports')).not.toBeInTheDocument();
  });

  it('hides the minimap tab without a region, since it could not fetch anything', () => {
    render(<MatchItem match={match} playerName="BlueSupport" />);
    expand();
    expect(screen.queryByRole('button', { name: 'Minimapa' })).not.toBeInTheDocument();
  });

  it('hides the minimap tab on maps the projection is not calibrated for', () => {
    const aram = { ...match, gameMode: 'ARAM' };
    render(<MatchItem match={aram} playerName="BlueSupport" region="asia" />);
    expand();
    expect(screen.queryByRole('button', { name: 'Minimapa' })).not.toBeInTheDocument();
  });
});
