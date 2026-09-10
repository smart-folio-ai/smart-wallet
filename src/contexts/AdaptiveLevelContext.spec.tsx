import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, renderHook, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {ReactNode} from 'react';
import {
  AdaptiveLevelProvider,
  useAdaptiveLevel,
} from './AdaptiveLevelContext';

const {getProfileMock, setOverrideMock} = vi.hoisted(() => ({
  getProfileMock: vi.fn(),
  setOverrideMock: vi.fn(),
}));

vi.mock('@/services/ai/investorProfile', () => ({
  getInvestorProfile: getProfileMock,
  setInvestorProfileOverride: setOverrideMock,
}));

const CACHE_KEY = 'adaptive-level';

function profile(overrides: Record<string, unknown> = {}) {
  return {
    sophistication: 'experienced',
    riskTolerance: 'moderate',
    confidence: 0.8,
    signals: {},
    source: 'inferred',
    ...overrides,
  };
}

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

function TestConsumer() {
  const {level, setLevel, clearOverride, confidence, source} =
    useAdaptiveLevel();
  return (
    <div>
      <span>nível: {level}</span>
      <span>confiança: {confidence ?? 'nenhuma'}</span>
      <span>origem: {source ?? 'nenhuma'}</span>
      <button onClick={() => setLevel('iniciante')}>ir pra iniciante</button>
      <button onClick={clearOverride}>voltar ao automático</button>
    </div>
  );
}

describe('AdaptiveLevelContext', () => {
  beforeEach(() => {
    localStorage.removeItem(CACHE_KEY);
    getProfileMock.mockReset();
    setOverrideMock.mockReset();
    getProfileMock.mockResolvedValue(profile());
    setOverrideMock.mockImplementation(async (override) =>
      profile({...override, source: 'user_override'}),
    );
  });

  // O ponto central de TRA-142: o servidor manda, não o localStorage.
  it('usa o perfil do servidor como fonte de verdade', async () => {
    render(<TestConsumer />, {wrapper});
    expect(await screen.findByText('nível: avancado')).toBeInTheDocument();
    expect(getProfileMock).toHaveBeenCalled();
  });

  it('prefere o servidor mesmo quando há valor local divergente', async () => {
    localStorage.setItem(CACHE_KEY, 'iniciante');
    render(<TestConsumer />, {wrapper});
    // Pinta com o cache primeiro para não piscar...
    expect(screen.getByText('nível: iniciante')).toBeInTheDocument();
    // ...e o servidor corrige quando chega.
    expect(await screen.findByText('nível: avancado')).toBeInTheDocument();
  });

  it('preserva os três estados, sem achatar o intermediário', async () => {
    getProfileMock.mockResolvedValue(profile({sophistication: 'intermediate'}));
    render(<TestConsumer />, {wrapper});
    expect(await screen.findByText('nível: intermediario')).toBeInTheDocument();
  });

  it('grava a troca de nível como override no servidor', async () => {
    const user = userEvent.setup();
    render(<TestConsumer />, {wrapper});
    await screen.findByText('nível: avancado');

    await user.click(screen.getByText('ir pra iniciante'));

    // Otimista: reflete antes da resposta voltar.
    expect(screen.getByText('nível: iniciante')).toBeInTheDocument();
    await waitFor(() =>
      expect(setOverrideMock).toHaveBeenCalledWith({sophistication: 'beginner'}),
    );
  });

  it('expõe confiança e origem para a interface poder explicar a escolha', async () => {
    getProfileMock.mockResolvedValue(
      profile({confidence: 0.3, source: 'user_override'}),
    );
    render(<TestConsumer />, {wrapper});
    expect(await screen.findByText('confiança: 0.3')).toBeInTheDocument();
    expect(screen.getByText('origem: user_override')).toBeInTheDocument();
  });

  it('cai no default quando o perfil do servidor falha', async () => {
    getProfileMock.mockRejectedValue(new Error('offline'));
    render(<TestConsumer />, {wrapper});
    await waitFor(() => expect(getProfileMock).toHaveBeenCalled());
    expect(screen.getByText('nível: intermediario')).toBeInTheDocument();
  });

  // Sem isto o override é porta de mão única: quem testa "avançado" uma vez
  // nunca mais volta a acompanhar a própria evolução.
  it('volta ao nível inferido quando o override é limpo', async () => {
    const user = userEvent.setup();
    getProfileMock.mockResolvedValue(
      profile({sophistication: 'beginner', source: 'user_override'}),
    );
    setOverrideMock.mockResolvedValue(
      profile({sophistication: 'experienced', source: 'inferred'}),
    );

    render(<TestConsumer />, {wrapper});
    expect(await screen.findByText('nível: iniciante')).toBeInTheDocument();

    await user.click(screen.getByText('voltar ao automático'));

    // `null` explícito é o que limpa o override no contrato do servidor.
    await waitFor(() =>
      expect(setOverrideMock).toHaveBeenCalledWith({sophistication: null}),
    );
    expect(await screen.findByText('nível: avancado')).toBeInTheDocument();
    expect(screen.getByText('origem: inferred')).toBeInTheDocument();
  });

  it('lança erro quando usado fora do provider', () => {
    const {result} = renderHook(() => {
      try {
        return useAdaptiveLevel();
      } catch (e) {
        return e as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(/AdaptiveLevelProvider/);
  });
});
