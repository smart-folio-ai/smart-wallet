import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {FaqSection} from './FaqSection';

describe('FaqSection', () => {
  it('ancora em #faq e expõe as perguntas como botões acessíveis', () => {
    const {container} = render(<FaqSection />);

    expect(container.querySelector('#faq')).not.toBeNull();
    expect(
      screen.getByRole('button', {name: /meus dados ficam seguros/i}),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {name: /posso cancelar quando quiser/i}),
    ).toBeInTheDocument();
  });

  it('deixa claro que não há recomendação de investimento', () => {
    render(<FaqSection />);
    expect(
      screen.getByRole('button', {name: /recomenda o que comprar/i}),
    ).toBeInTheDocument();
  });
});
