import {render, screen, fireEvent} from '@testing-library/react';
import {KpiCard} from './KpiCard';

test('renders label and value', () => {
  render(<KpiCard label="Patrimônio" value="R$ 100.000" />);
  expect(screen.getByText('Patrimônio')).toBeInTheDocument();
  expect(screen.getByText('R$ 100.000')).toBeInTheDocument();
});

test('renders delta and sub when provided', () => {
  render(<KpiCard label="P&L" value="+R$ 5.000" delta="+12,3%" sub="no período" />);
  expect(screen.getByText('+12,3%')).toBeInTheDocument();
  expect(screen.getByText('no período')).toBeInTheDocument();
});

test('tooltip shows on hover', () => {
  render(<KpiCard label="Beta" value="0,82" tooltip={{title: 'Beta', body: 'Medida de volatilidade'}} />);
  const btn = screen.getByRole('button', {name: 'O que é isso?'});
  fireEvent.mouseEnter(btn);
  expect(screen.getByText('Medida de volatilidade')).toBeInTheDocument();
  fireEvent.mouseLeave(btn);
  expect(screen.queryByText('Medida de volatilidade')).not.toBeInTheDocument();
});
