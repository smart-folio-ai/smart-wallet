import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Ticker} from './Ticker';

describe('Ticker', () => {
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

  it('renderiza o valor final formatado antes de qualquer animação', () => {
    render(<Ticker value={284930} format={(n) => `R$ ${Math.round(n)}`} />);
    expect(screen.getByText('R$ 284930')).toBeInTheDocument();
  });

  it('usa tabular-nums para o número não dançar ao animar', () => {
    const {container} = render(<Ticker value={12} />);
    expect(container.firstElementChild?.className).toContain('tabular-nums');
  });
});
