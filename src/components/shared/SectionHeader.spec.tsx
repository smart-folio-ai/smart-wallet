import {render, screen, fireEvent} from '@testing-library/react';
import {vi} from 'vitest';
import {SectionHeader} from './SectionHeader';
import {AiInsightBanner} from './AiInsightBanner';

test('SectionHeader renders title and subtitle', () => {
  render(<SectionHeader title="Evolução" subtitle="Base 100" />);
  expect(screen.getByText('Evolução')).toBeInTheDocument();
  expect(screen.getByText('Base 100')).toBeInTheDocument();
});

test('SectionHeader renders action slot', () => {
  render(<SectionHeader title="X" action={<button>Filtrar</button>} />);
  expect(screen.getByRole('button', {name: 'Filtrar'})).toBeInTheDocument();
});

test('AiInsightBanner renders text and action button', () => {
  const onAction = vi.fn();
  render(<AiInsightBanner text="Cobertura 41%" actionLabel="Abrir planejamento" onAction={onAction} />);
  expect(screen.getByText('Cobertura 41%')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', {name: 'Abrir planejamento'}));
  expect(onAction).toHaveBeenCalledTimes(1);
});
