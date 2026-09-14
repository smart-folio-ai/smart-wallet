import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {InvestmentPolicyCard, parsePercent} from './InvestmentPolicyCard';
import {investmentPolicyService} from '@/server/api/api';

const toast = {success: vi.fn(), error: vi.fn()};
vi.mock('@/hooks/use-app-toast', () => ({default: () => toast}));
vi.mock('@/server/api/api', () => ({
  investmentPolicyService: {get: vi.fn(), save: vi.fn(), versions: vi.fn()},
}));

const policy = {
  maxAssetWeightPct: 8,
  maxSectorWeightPct: 25,
  fixedIncomeTargetPct: 25,
  brStocksTargetPct: 28,
  maxCryptoPct: 5,
  benchmark: 'IBOV_CDI' as const,
};

const renderCard = () =>
  render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
      <InvestmentPolicyCard />
    </QueryClientProvider>,
  );

describe('InvestmentPolicyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(investmentPolicyService.get).mockResolvedValue({
      data: {policy, isDefault: true, savedAt: null},
    } as never);
    vi.mocked(investmentPolicyService.save).mockResolvedValue({data: {}} as never);
  });

  it('parses the percent formats people type', () => {
    expect(parsePercent('8%')).toBe(8);
    expect(parsePercent(' 8,5 % ')).toBe(8.5);
    expect(parsePercent('101')).toBeNull();
    expect(parsePercent('-1')).toBeNull();
    expect(parsePercent('abc')).toBeNull();
  });

  it('shows the saved policy with the handoff labels', async () => {
    renderCard();

    expect(await screen.findByLabelText('Limite por ativo')).toHaveValue('8%');
    expect(screen.getByLabelText('Benchmark de comparação')).toHaveValue('IBOV_CDI');
  });

  it('saves the parsed numbers', async () => {
    renderCard();
    fireEvent.change(await screen.findByLabelText('Limite por ativo'), {target: {value: '10,5%'}});
    fireEvent.click(screen.getByRole('button', {name: 'Salvar política'}));

    await waitFor(() =>
      expect(investmentPolicyService.save).toHaveBeenCalledWith({...policy, maxAssetWeightPct: 10.5}),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('blocks an invalid percent before calling the API', async () => {
    renderCard();
    fireEvent.change(await screen.findByLabelText('Exposição máx. em cripto'), {target: {value: '150%'}});
    fireEvent.click(screen.getByRole('button', {name: 'Salvar política'}));

    expect(toast.error).toHaveBeenCalledWith('Valor inválido', expect.stringContaining('Exposição máx. em cripto'));
    expect(investmentPolicyService.save).not.toHaveBeenCalled();
  });

  it('restores an older version into the form without saving', async () => {
    vi.mocked(investmentPolicyService.versions).mockResolvedValue({
      data: [{policy: {...policy, maxCryptoPct: 2}, savedAt: '2026-08-01T12:00:00.000Z'}],
    } as never);
    renderCard();
    fireEvent.click(await screen.findByRole('button', {name: 'Ver histórico de versões'}));
    fireEvent.click(await screen.findByRole('button', {name: 'Restaurar'}));

    await waitFor(() => expect(screen.getByLabelText('Exposição máx. em cripto')).toHaveValue('2%'));
    expect(investmentPolicyService.save).not.toHaveBeenCalled();
  });
});
