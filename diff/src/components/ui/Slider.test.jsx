import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Slider } from './Slider';

describe('Slider', () => {
  it('renders as a slider with an accessible name', () => {
    render(<Slider label="Minuto" min={0} max={31} value={0} onChange={() => {}} />);
    expect(screen.getByRole('slider', { name: 'Minuto' })).toBeInTheDocument();
  });

  it('reports the numeric value to onChange', () => {
    const onChange = vi.fn();
    render(<Slider label="Minuto" min={0} max={31} value={0} onChange={onChange} />);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith(12);
  });

  it('announces the human-readable label, not the raw index', () => {
    render(<Slider label="Minuto" min={0} max={31} value={12} valueLabel="12:00" onChange={() => {}} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuetext', '12:00');
    expect(screen.getByText('12:00')).toBeInTheDocument();
  });

  it('blocks changes when disabled', () => {
    const onChange = vi.fn();
    render(<Slider label="Minuto" min={0} max={31} value={0} onChange={onChange} disabled />);

    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it('does not throw when no onChange is supplied', () => {
    render(<Slider label="Minuto" min={0} max={5} value={1} />);
    expect(() => fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } })).not.toThrow();
  });
});
