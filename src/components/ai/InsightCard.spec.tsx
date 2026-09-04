import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {TooltipProvider} from '@/components/ui/tooltip';
import {InsightCard, InsightCardData} from './InsightCard';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderCard(insight: InsightCardData) {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <InsightCard insight={insight} />
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe('InsightCard', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('renderiza no formato legado (apenas title + body) sem quebrar', () => {
    renderCard({
      priority: 'Média',
      category: 'Estratégia',
      title: 'Rebalancear posição em PETR4',
      body: 'Movimentação sugerida pelo modelo de rebalanceamento.',
    });

    expect(screen.getByText('Rebalancear posição em PETR4')).toBeInTheDocument();
    expect(
      screen.getByText('Movimentação sugerida pelo modelo de rebalanceamento.'),
    ).toBeInTheDocument();
    expect(screen.getByText('MÉDIO')).toBeInTheDocument();
    expect(screen.getByText('Estratégia')).toBeInTheDocument();
  });

  it('renderiza confidence pill com o rótulo do bucket informado', () => {
    renderCard({
      title: 'Reduzir concentração',
      rationale: 'Concentração de 42% em um único ticker.',
      confidence: {value: 0.82, bucket: 'alta', reason: 'Baseado em 3 sinais.'},
    });

    expect(screen.getByLabelText('Confiança alta')).toBeInTheDocument();
    expect(screen.getByText(/Confiança alta/)).toBeInTheDocument();
    expect(
      screen.getByText('Concentração de 42% em um único ticker.'),
    ).toBeInTheDocument();
  });

  it('renderiza evidence e sources chips (com link quando há URL)', () => {
    renderCard({
      title: 'Diversificar setores',
      evidence: [
        {label: 'HHI', value: '0.42', source: 'portfolio-service'},
        {label: 'Setores distintos', value: 2},
      ],
      sources: [
        {label: 'Radar de erro', url: 'https://example.com/radar'},
        {label: 'B3'},
      ],
    });

    expect(screen.getByText('HHI')).toBeInTheDocument();
    expect(screen.getByText('0.42')).toBeInTheDocument();
    expect(screen.getByText('Setores distintos')).toBeInTheDocument();

    const link = screen.getByRole('link', {name: /Radar de erro/});
    expect(link).toHaveAttribute('href', 'https://example.com/radar');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('B3')).toBeInTheDocument();
  });

  it('clica no botão de ação e navega com route + payload em state', () => {
    renderCard({
      title: 'Revisar alocação em renda fixa',
      action: {
        label: 'Abrir rebalanceador',
        route: '/portfolio/rebalance',
        payload: {focus: 'fixed_income', factor: 1.2},
        why: 'Rebalanceamento reduz o risco em 12%.',
      },
    });

    const button = screen.getByRole('button', {name: 'Abrir rebalanceador'});
    expect(
      screen.getByText('Rebalanceamento reduz o risco em 12%.'),
    ).toBeInTheDocument();

    fireEvent.click(button);

    expect(navigateMock).toHaveBeenCalledTimes(1);
    const [to, opts] = navigateMock.mock.calls[0];
    // Payload plano vira querystring; ordem dos params depende do URLSearchParams.
    expect(to).toMatch(/^\/portfolio\/rebalance\?/);
    expect(to).toContain('focus=fixed_income');
    expect(to).toContain('factor=1.2');
    expect(opts).toEqual({state: {focus: 'fixed_income', factor: 1.2}});
  });

  it('quando payload é aninhado, usa apenas navigate state (sem querystring)', () => {
    renderCard({
      title: 'Comparar cenário custom',
      action: {
        label: 'Abrir simulador',
        route: '/ai/simulator',
        payload: {scenario: {returns: [0.08, 0.12]}},
      },
    });

    fireEvent.click(screen.getByRole('button', {name: 'Abrir simulador'}));

    expect(navigateMock).toHaveBeenCalledWith('/ai/simulator', {
      state: {scenario: {returns: [0.08, 0.12]}},
    });
  });

  it('não renderiza botão de ação quando action está ausente (shape legada)', () => {
    renderCard({title: 'Sem action'});
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
