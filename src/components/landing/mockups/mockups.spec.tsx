import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {PortfolioMockup} from './PortfolioMockup';
import {AiAlertMockup} from './AiAlertMockup';
import {TaxMockup} from './TaxMockup';

describe('mockups de produto', () => {
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

  it('PortfolioMockup lista posições com peso na carteira', () => {
    render(<PortfolioMockup />);
    expect(screen.getByText('PETR4')).toBeInTheDocument();
    expect(screen.getByText('23,4%')).toBeInTheDocument();
  });

  it('AiAlertMockup mostra alerta priorizado com severidade', () => {
    render(<AiAlertMockup />);
    expect(screen.getByText(/concentração acima do limite/i)).toBeInTheDocument();
    expect(screen.getAllByText(/alta/i).length).toBeGreaterThan(0);
  });

  it('TaxMockup mostra a DARF calculada', () => {
    render(<TaxMockup />);
    expect(screen.getByText(/darf a pagar/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?1\.284,60/)).toBeInTheDocument();
  });
});
