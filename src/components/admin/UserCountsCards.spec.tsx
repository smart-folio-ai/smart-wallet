import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {UserCountsCards} from './UserCountsCards';

const counts = {
  total: 1200,
  newLast7Days: 35,
  newLast30Days: 140,
  activeLast24h: 60,
  activeLast7Days: 300,
  activeLast30Days: 720,
};

describe('UserCountsCards (TRA-192)', () => {
  it('mostra contas criadas e ativos por janela', () => {
    render(<UserCountsCards counts={counts} isLoading={false} />);

    expect(screen.getByTestId('user-kpi-Contas criadas')).toHaveTextContent('1.200');
    expect(screen.getByTestId('user-kpi-Ativos em 24 h')).toHaveTextContent('60');
    expect(screen.getByTestId('user-kpi-Ativos em 7 dias')).toHaveTextContent('300');
    expect(screen.getByTestId('user-kpi-Ativos em 30 dias')).toHaveTextContent('720');
    expect(screen.getByText('+35')).toBeInTheDocument();
    // 720 / 1200 = 60%
    expect(screen.getByText('60% das contas')).toBeInTheDocument();
  });

  it('API sem o campo users mostra "—", nunca um zero falso', () => {
    render(<UserCountsCards counts={undefined} isLoading={false} />);

    for (const label of ['Contas criadas', 'Ativos em 24 h', 'Ativos em 7 dias', 'Ativos em 30 dias']) {
      expect(screen.getByTestId(`user-kpi-${label}`)).toHaveTextContent('—');
    }
  });

  it('base vazia não divide por zero', () => {
    render(
      <UserCountsCards
        counts={{...counts, total: 0, activeLast24h: 0, activeLast7Days: 0, activeLast30Days: 0}}
        isLoading={false}
      />,
    );

    expect(screen.getAllByText('0% das contas')).toHaveLength(3);
  });

  it('mostra carregando enquanto a API responde', () => {
    render(<UserCountsCards counts={undefined} isLoading />);

    expect(screen.getByTestId('user-kpi-Contas criadas')).toHaveTextContent('...');
  });
});
