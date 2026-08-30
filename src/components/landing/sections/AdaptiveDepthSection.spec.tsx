import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {AdaptiveDepthSection} from './AdaptiveDepthSection';

describe('AdaptiveDepthSection', () => {
  it('mostra o nível intermediário por padrão', () => {
    render(<AdaptiveDepthSection />);
    expect(screen.getByText('Retorno acumulado')).toBeInTheDocument();
    expect(screen.getByText('+8,2%')).toBeInTheDocument();
  });

  it('troca o conteúdo do card ao clicar em Iniciante', async () => {
    const user = userEvent.setup();
    render(<AdaptiveDepthSection />);
    await user.click(screen.getByRole('button', {name: 'Iniciante'}));
    expect(screen.getByText('Como está indo')).toBeInTheDocument();
    expect(screen.getByText('+8,2% este ano')).toBeInTheDocument();
  });

  it('troca o conteúdo do card ao clicar em Avançado', async () => {
    const user = userEvent.setup();
    render(<AdaptiveDepthSection />);
    await user.click(screen.getByRole('button', {name: 'Avançado'}));
    expect(screen.getByText('Sharpe / Retorno acum.')).toBeInTheDocument();
    expect(screen.getByText('1,84 / +8,2%')).toBeInTheDocument();
  });
});
