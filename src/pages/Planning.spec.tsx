import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, fireEvent, waitFor, within} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Planning from './Planning';
import {financialPlanService} from '@/server/api/api';

const toast = {success: vi.fn(), error: vi.fn()};
vi.mock('@/hooks/use-app-toast', () => ({default: () => toast}));
vi.mock('@/hooks/usePortfolioComposition', () => ({
  usePortfolioComposition: () => ({data: {rebalancing: {totalValue: 100000}, yield: {estimatedAnnualIncome: 12000}}}),
}));
vi.mock('@/server/api/api', () => ({
  financialPlanService: {get: vi.fn(), updateSettings: vi.fn(), addGoal: vi.fn(), updateGoal: vi.fn(), removeGoal: vi.fn()},
}));

const plan = {
  monthlyContribution: 1000,
  expectedRealReturnPct: 6,
  horizonYears: 20,
  goals: [
    {id: 'g1', title: 'Independência financeira', kind: 'independence', targetAmount: 1000000, currentAmount: 0, monthlyContribution: 0},
    {id: 'g2', title: 'Reserva de emergência', kind: 'emergency', targetAmount: 20000, currentAmount: 19000, monthlyContribution: 500},
  ],
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
      <Planning />
    </QueryClientProvider>,
  );

describe('Planning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(financialPlanService.get).mockResolvedValue({data: plan} as never);
  });

  it('shows goal progress from the portfolio and the manual amounts', async () => {
    renderPage();
    const cards = await screen.findAllByTestId('planning-goal');

    expect(within(cards[0]).getByText('10,0% concluído')).toBeInTheDocument();
    expect(within(cards[1]).getByText('95,0% concluído')).toBeInTheDocument();
    expect(within(cards[1]).getByText(/Faltam R\$\s1\.000,00/)).toBeInTheDocument();
    expect(screen.getByText('Projeção de patrimônio · 20 anos')).toBeInTheDocument();
  });

  it('simulates a higher contribution and applies it to the plan', async () => {
    vi.mocked(financialPlanService.updateSettings).mockResolvedValue({data: {...plan, monthlyContribution: 3000}} as never);
    renderPage();
    const input = await screen.findByLabelText('Aporte mensal');
    fireEvent.change(input, {target: {value: '3000'}});

    expect(screen.getByTestId('sim-result')).toHaveTextContent('mais cedo');
    fireEvent.click(screen.getByRole('button', {name: 'Aplicar ao plano'}));
    await waitFor(() =>
      expect(financialPlanService.updateSettings).toHaveBeenCalledWith({monthlyContribution: 3000, expectedRealReturnPct: 6, horizonYears: 20}),
    );
  });

  it('creates a goal from the dialog', async () => {
    vi.mocked(financialPlanService.addGoal).mockResolvedValue({data: plan} as never);
    renderPage();
    fireEvent.click(await screen.findByRole('button', {name: 'Nova meta'}));
    fireEvent.change(screen.getByLabelText('Nome'), {target: {value: 'Entrada do imóvel'}});
    fireEvent.change(screen.getByLabelText('Valor da meta'), {target: {value: '420.000'}});
    fireEvent.change(screen.getByLabelText('Já guardado'), {target: {value: '148.500'}});
    fireEvent.change(screen.getByLabelText('Aporte mensal da meta'), {target: {value: '3500'}});
    fireEvent.click(screen.getByRole('button', {name: 'Salvar meta'}));

    await waitFor(() =>
      expect(financialPlanService.addGoal).toHaveBeenCalledWith({title: 'Entrada do imóvel', kind: 'custom', targetAmount: 420000, currentAmount: 148500, monthlyContribution: 3500}),
    );
  });
});
