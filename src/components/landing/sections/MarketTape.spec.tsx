import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MarketTape} from './MarketTape';

describe('MarketTape', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  it('duplica a lista para o loop não ter emenda visível', () => {
    render(<MarketTape />);
    expect(screen.getAllByText('PETR4')).toHaveLength(2);
  });

  it('marca alta e baixa com cores semânticas distintas', () => {
    render(<MarketTape />);
    const alta = screen.getAllByText('+2,14%')[0];
    const baixa = screen.getAllByText('-0,42%')[0];

    expect(alta.className).toContain('text-positive');
    expect(baixa.className).toContain('text-negative');
  });
});
