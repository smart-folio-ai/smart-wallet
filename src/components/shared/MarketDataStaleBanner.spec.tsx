import {render, screen} from '@testing-library/react';
import {MarketDataStaleBanner} from './MarketDataStaleBanner';

test('shows the last known good clock time when the feed is stale', () => {
  const at = new Date();
  at.setHours(14, 32, 0, 0);
  render(
    <MarketDataStaleBanner
      updatedAt={at.getTime()}
      staleCount={2}
      totalCount={5}
      staleSymbols={['PETR4', 'ITUB4']}
    />,
  );
  expect(
    screen.getByText(/Dados de mercado indisponíveis desde 14:32/),
  ).toBeInTheDocument();
  expect(screen.getByText(/2 de 5 ativos sem cotação/)).toBeInTheDocument();
  expect(screen.getByText(/PETR4, ITUB4/)).toBeInTheDocument();
});

test('falls back to a generic headline when no fetch time is known yet', () => {
  render(
    <MarketDataStaleBanner updatedAt={null} staleCount={1} totalCount={1} />,
  );
  expect(
    screen.getByText('Dados de mercado indisponíveis'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/1 de 1 ativo sem cotação/),
  ).toBeInTheDocument();
});

test('truncates the symbol preview to three with a +N suffix', () => {
  render(
    <MarketDataStaleBanner
      updatedAt={null}
      staleCount={5}
      totalCount={10}
      staleSymbols={['A', 'B', 'C', 'D', 'E']}
    />,
  );
  expect(screen.getByText(/A, B, C \+2/)).toBeInTheDocument();
});
