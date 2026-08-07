import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ProblemSection} from './ProblemSection';

describe('ProblemSection', () => {
  it('nomeia o problema como falta de controle, não de investimento', () => {
    render(<ProblemSection />);
    expect(
      screen.getByText(/você não tem um problema de investimento/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/tem um problema de controle/i)).toBeInTheDocument();
  });

  it('apresenta as três dores como cartões', () => {
    render(<ProblemSection />);
    expect(
      screen.getByText(/ativos em três corretoras diferentes/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/o ir vira um fim de semana perdido/i)).toBeInTheDocument();
    expect(
      screen.getByText(/a concentração aparece tarde demais/i),
    ).toBeInTheDocument();
  });
});
