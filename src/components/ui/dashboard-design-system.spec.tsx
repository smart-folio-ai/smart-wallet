import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {Card} from './card';
import {SeverityBadge} from './severity-badge';
import {MetricCell, MetricCellGrid} from './metric-cell';
import {PriorityFeed, PriorityFeedItem} from './priority-feed';

describe('Card variant', () => {
  it('mantém a classe padrão do shadcn quando nenhuma variante é passada', () => {
    const {container} = render(<Card>conteudo</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('border-border/80');
    expect(el.className).toContain('bg-card');
    expect(el.className).not.toContain('backdrop-blur-xl');
  });

  it('variant="glass" aplica o vocabulário visual da landing', () => {
    const {container} = render(<Card variant="glass">conteudo</Card>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('backdrop-blur-xl');
    expect(el.className).toContain('surface-hairline');
    expect(el.className).not.toContain('shadow-sm');
  });
});

describe('SeverityBadge', () => {
  it('renderiza o rótulo em português para cada severidade', () => {
    render(<SeverityBadge severity="alta" />);
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });

  it('usa média como padrão', () => {
    render(<SeverityBadge />);
    expect(screen.getByText('Média')).toBeInTheDocument();
  });
});

describe('MetricCell', () => {
  it('renderiza rótulo, valor e complemento', () => {
    render(
      <MetricCellGrid>
        <MetricCell label="Patrimônio" value="R$ 284.930" sub="27 posições" />
      </MetricCellGrid>,
    );
    expect(screen.getByText('Patrimônio')).toBeInTheDocument();
    expect(screen.getByText('R$ 284.930')).toBeInTheDocument();
    expect(screen.getByText('27 posições')).toBeInTheDocument();
  });

  it('estado de alerta aplica a cor de warning ao valor', () => {
    render(
      <MetricCellGrid>
        <MetricCell label="Concentração" value="23,4%" alert />
      </MetricCellGrid>,
    );
    expect(screen.getByText('23,4%').className).toContain('text-warning');
  });
});

describe('PriorityFeed', () => {
  it('renderiza itens com severidade, título e origem', () => {
    render(
      <PriorityFeed>
        <PriorityFeedItem
          severity="alta"
          title="PETR4 representa 23,4% da carteira"
          description="Seu limite definido é 15%."
          source="Radar Anti-Erro"
        />
      </PriorityFeed>,
    );
    expect(
      screen.getByText('PETR4 representa 23,4% da carteira'),
    ).toBeInTheDocument();
    expect(screen.getByText('Seu limite definido é 15%.')).toBeInTheDocument();
    expect(screen.getByText('origem: Radar Anti-Erro')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();
  });
});
