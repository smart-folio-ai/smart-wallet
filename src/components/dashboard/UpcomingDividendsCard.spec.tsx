import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {UpcomingDividendsCard} from './UpcomingDividendsCard';

const renderCard = (props: Partial<Parameters<typeof UpcomingDividendsCard>[0]> = {}) =>
  render(
    <MemoryRouter>
      <UpcomingDividendsCard
        items={[]}
        totalNetValue={0}
        windowDays={45}
        positionValueBySymbol={{}}
        {...props}
      />
    </MemoryRouter>,
  );

describe('UpcomingDividendsCard', () => {
  it('renders the handoff header with the window and total', () => {
    renderCard({totalNetValue: 165.44});

    expect(screen.getByText('Proventos a receber')).toBeInTheDocument();
    expect(screen.getByText(/Próximos 45 dias · R\$\s?165,44 previstos/)).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Dividendos →'})).toHaveAttribute('href', '/dividends');
  });

  it('lists each pending payment with type, UTC payment date, value and yield on the position', () => {
    renderCard({
      totalNetValue: 14.39,
      positionValueBySymbol: {MOVI3: 719.5},
      items: [
        {
          id: '1',
          portfolioId: 'p',
          symbol: 'MOVI3',
          paymentType: 'JCP',
          expectedPaymentDate: '2026-09-11T00:00:00.000Z',
          quantity: 32,
          unitValue: 0.45,
          netValue: 14.39,
        },
      ],
    });

    expect(screen.getByText('MOV')).toBeInTheDocument();
    expect(screen.getByText('JCP · pagamento 11/09')).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s?14,39/).length).toBeGreaterThan(0);
    expect(screen.getByText('2,00%')).toBeInTheDocument();
  });

  it('shows "—" for yield when the position is not in the portfolio, and an import hint when empty', () => {
    const {unmount} = renderCard({
      items: [
        {
          id: '1',
          portfolioId: 'p',
          symbol: 'VBBR3',
          paymentType: 'DIVIDEND',
          expectedPaymentDate: '2026-12-16T00:00:00.000Z',
          quantity: 10,
          unitValue: 1,
          netValue: 10,
        },
      ],
    });
    expect(screen.getByText('—')).toBeInTheDocument();
    unmount();

    renderCard();
    expect(screen.getByText(/Importe o relatório de Eventos da B3/)).toBeInTheDocument();
  });
});
