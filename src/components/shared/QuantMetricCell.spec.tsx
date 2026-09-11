import {describe, it, expect} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {QuantMetricCell} from './QuantMetricCell';

const tooltip = {
  title: 'Beta vs IBOV',
  body: 'Quanto a carteira se move quando o IBOV se move.',
  formula: 'covariância(carteira, IBOV) ÷ variância(IBOV) · janela 252 dias úteis',
};

describe('QuantMetricCell', () => {
  it('mostra rótulo, valor e nota', () => {
    render(<QuantMetricCell label="Beta vs IBOV" value="0,86" note="240 pregões" />);

    expect(screen.getByText('Beta vs IBOV')).toBeInTheDocument();
    expect(screen.getByText('0,86')).toBeInTheDocument();
    expect(screen.getByText('240 pregões')).toBeInTheDocument();
  });

  it('não renderiza botão de info sem tooltip', () => {
    render(<QuantMetricCell label="Sharpe" value="1,42" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // Handoff: a tooltip traz nome, definição e fórmula com janela.
  it('abre a tooltip no clique com nome, definição e fórmula', () => {
    render(<QuantMetricCell label="Beta vs IBOV" value="0,86" tooltip={tooltip} />);

    const button = screen.getByRole('button', {name: 'O que é Beta vs IBOV?'});
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.click(button);

    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Quanto a carteira se move quando o IBOV se move.');
    expect(tip).toHaveTextContent('janela 252 dias úteis');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  // Handoff: "abre em hover, foco de teclado e clique".
  it('abre no foco de teclado e fecha ao perder o foco', () => {
    render(<QuantMetricCell label="Beta vs IBOV" value="0,86" tooltip={tooltip} />);
    const button = screen.getByRole('button', {name: 'O que é Beta vs IBOV?'});

    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('abre no hover', () => {
    render(<QuantMetricCell label="Beta vs IBOV" value="0,86" tooltip={tooltip} />);
    const button = screen.getByRole('button', {name: 'O que é Beta vs IBOV?'});

    fireEvent.mouseEnter(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // A barra não corta mais o overflow; as pontas arredondam os próprios cantos.
  it('arredonda só os cantos da ponta indicada', () => {
    const {container: first} = render(
      <QuantMetricCell label="Sharpe" value="1,42" edge="first" />,
    );
    expect(first.firstChild).toHaveStyle({
      borderTopLeftRadius: '7px',
      borderBottomLeftRadius: '7px',
    });

    const {container: middle} = render(
      <QuantMetricCell label="Volatilidade" value="12,8%" />,
    );
    expect((middle.firstChild as HTMLElement).style.borderTopLeftRadius).toBe('');
  });
});
