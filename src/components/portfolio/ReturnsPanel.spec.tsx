import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import ReturnsPanel from './ReturnsPanel';
import {AdaptiveLevelProvider} from '@/contexts/AdaptiveLevelContext';

const {getProfileMock, setOverrideMock, getReturnsMock} = vi.hoisted(() => ({
  getProfileMock: vi.fn(),
  setOverrideMock: vi.fn(),
  getReturnsMock: vi.fn(),
}));

vi.mock('@/services/ai/investorProfile', () => ({
  getInvestorProfile: getProfileMock,
  setInvestorProfileOverride: setOverrideMock,
}));

vi.mock('@/server/api/api', () => ({
  portfolioService: {
    getReturns: (...args: unknown[]) => getReturnsMock(...args),
  },
}));

const returns = (overrides: Record<string, unknown> = {}) => ({
  data: {
    from: '2025-01-02',
    to: '2025-06-30',
    contribution: {
      currentValue: 50000,
      contributed: 45000,
      marketGain: 5000,
      marketGainPct: 0.111111,
    },
    twr: {value: 0.1234, annualized: 0.26, periods: 120},
    irr: 0.1501,
    unavailable: [],
    staleDays: 0,
    ...overrides,
  },
});

function wrapper({children}: {children: ReactNode}) {
  const client = new QueryClient({
    defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
  });
  return (
    <QueryClientProvider client={client}>
      <AdaptiveLevelProvider>{children}</AdaptiveLevelProvider>
    </QueryClientProvider>
  );
}

const withLevel = (sophistication: string) => {
  getProfileMock.mockResolvedValue({
    sophistication,
    riskTolerance: 'moderate',
    confidence: 0.9,
    signals: {},
    source: 'inferred',
  });
};

describe('ReturnsPanel', () => {
  beforeEach(() => {
    getProfileMock.mockReset();
    setOverrideMock.mockReset();
    getReturnsMock.mockReset();
    getReturnsMock.mockResolvedValue(returns());
    withLevel('intermediate');
  });

  // A decomposição é a única métrica que serve aos três perfis — muda de
  // apresentação, não de disponibilidade.
  it('mostra aporte e rendimento nos três níveis', async () => {
    for (const level of ['beginner', 'intermediate', 'experienced']) {
      withLevel(level);
      const {unmount} = render(<ReturnsPanel />, {wrapper});
      expect(await screen.findByText(/45\.000/)).toBeInTheDocument();
      unmount();
    }
  });

  it('fala em reais com o iniciante, sem percentual de rentabilidade', async () => {
    withLevel('beginner');
    render(<ReturnsPanel />, {wrapper});

    expect(await screen.findByText(/Como está indo seu dinheiro/)).toBeInTheDocument();
    // TWR não aparece para o iniciante: o percentual ao lado do valor em reais
    // é o número que mais confunde quem começa.
    expect(screen.queryByText(/Rentabilidade \(TWR\)/)).not.toBeInTheDocument();
  });

  it('mostra TWR a partir do intermediário', async () => {
    withLevel('intermediate');
    render(<ReturnsPanel />, {wrapper});

    expect(await screen.findByText(/Rentabilidade \(TWR\)/)).toBeInTheDocument();
    expect(screen.getByText('+12.34%')).toBeInTheDocument();
    // IRR é só do avançado.
    expect(screen.queryByText(/Retorno do seu capital/)).not.toBeInTheDocument();
  });

  it('mostra IRR ao lado do TWR no avançado', async () => {
    withLevel('experienced');
    render(<ReturnsPanel />, {wrapper});

    expect(await screen.findByText(/Retorno do seu capital \(IRR\)/)).toBeInTheDocument();
    expect(screen.getByText('+15.01%')).toBeInTheDocument();
  });

  // A diferença entre os dois é informação: mede acerto de timing dos aportes.
  it('explica a diferença entre IRR e TWR no avançado', async () => {
    withLevel('experienced');
    render(<ReturnsPanel />, {wrapper});

    expect(
      await screen.findByText(/aportes entraram em bons momentos/),
    ).toBeInTheDocument();
  });

  // O backend declara o que não conseguiu calcular; a tela precisa repassar.
  it('explica ao usuário o que não pôde ser calculado', async () => {
    getReturnsMock.mockResolvedValue(
      returns({unavailable: ['cash_flows_missing']}),
    );
    render(<ReturnsPanel />, {wrapper});

    expect(
      await screen.findByText(/Importe suas notas de corretagem/),
    ).toBeInTheDocument();
  });

  it('avisa quando a série teve dias sem cotação', async () => {
    getReturnsMock.mockResolvedValue(returns({staleDays: 3}));
    render(<ReturnsPanel />, {wrapper});

    expect(await screen.findByText(/3 dias da série sem cotação/)).toBeInTheDocument();
  });

  // Falhar aqui não pode derrubar o dashboard inteiro.
  it('some da tela quando a rota falha, em vez de quebrar a página', async () => {
    getReturnsMock.mockRejectedValue(new Error('500'));
    const {container} = render(<ReturnsPanel />, {wrapper});

    await vi.waitFor(() => expect(getReturnsMock).toHaveBeenCalled());
    await vi.waitFor(() =>
      expect(container.querySelector('p, span')).toBeNull(),
    );
  });

  it('trata prejuízo com a palavra certa para o iniciante', async () => {
    withLevel('beginner');
    getReturnsMock.mockResolvedValue(
      returns({
        contribution: {
          currentValue: 40000,
          contributed: 45000,
          marketGain: -5000,
          marketGainPct: -0.111111,
        },
      }),
    );
    render(<ReturnsPanel />, {wrapper});

    expect(await screen.findByText(/o mercado/)).toBeInTheDocument();
    expect(screen.getByText(/tirou/)).toBeInTheDocument();
  });
});
