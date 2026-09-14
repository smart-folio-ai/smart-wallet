import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, fireEvent, waitFor, within} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Reports from './Reports';
import {reportsService} from '@/server/api/api';

const toast = {success: vi.fn(), error: vi.fn()};
vi.mock('@/hooks/use-app-toast', () => ({default: () => toast}));
vi.mock('@/hooks/useCurrentUserProfile', () => ({
  useCurrentUserProfile: () => ({data: {email: 'ana@example.com'}}),
}));
vi.mock('@/server/api/api', () => ({
  reportsService: {
    download: vi.fn(),
    listSchedules: vi.fn(),
    createSchedule: vi.fn(),
    setScheduleStatus: vi.fn(),
    deleteSchedule: vi.fn(),
  },
}));

const schedule = {
  id: 's1',
  kind: 'portfolio',
  title: 'Carteira consolidada',
  format: 'pdf',
  frequency: 'monthly',
  status: 'active',
  nextRunAt: '2026-10-01T11:00:00.000Z',
  lastRunAt: null,
  lastError: null,
  pausedAt: null,
};

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
      <Reports />
    </QueryClientProvider>,
  );

describe('Reports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reportsService.listSchedules).mockResolvedValue({data: [schedule]} as never);
    vi.mocked(reportsService.download).mockResolvedValue({
      data: new Blob(['x']),
      headers: {'content-disposition': 'attachment; filename="carteira-consolidada-2026.xlsx"'},
    } as never);
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });

  it('renders the six handoff reports with their formats', () => {
    renderPage();

    for (const title of ['Carteira consolidada', 'Informe de rendimentos', 'Apuração fiscal anual', 'Relatório de risco', 'Extrato de operações', 'Pacote do contador']) {
      expect(screen.getByRole('heading', {name: title})).toBeInTheDocument();
    }
    expect(within(screen.getByTestId('report-accountant')).getByText('ZIP')).toBeInTheDocument();
  });

  it('downloads the report in the chosen format', async () => {
    renderPage();
    const card = screen.getByTestId('report-portfolio');
    fireEvent.click(within(card).getByRole('button', {name: 'XLSX'}));
    fireEvent.click(within(card).getByRole('button', {name: 'Gerar agora'}));

    await waitFor(() => expect(reportsService.download).toHaveBeenCalledWith('portfolio', 'xlsx', new Date().getFullYear()));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('lists schedules with the delivery e-mail and pauses one', async () => {
    vi.mocked(reportsService.setScheduleStatus).mockResolvedValue({data: {...schedule, status: 'paused'}} as never);
    renderPage();

    const row = await screen.findByTestId('report-schedule');
    expect(within(row).getByText('Carteira consolidada · mensal')).toBeInTheDocument();
    expect(within(row).getByText('PDF para ana@example.com')).toBeInTheDocument();
    fireEvent.click(within(row).getByRole('button', {name: 'Pausar Carteira consolidada'}));

    await waitFor(() => expect(reportsService.setScheduleStatus).toHaveBeenCalledWith('s1', 'paused'));
  });

  it('creates a schedule keeping the format valid for the chosen report', async () => {
    vi.mocked(reportsService.createSchedule).mockResolvedValue({data: schedule} as never);
    renderPage();
    fireEvent.click(screen.getByRole('button', {name: 'Novo agendamento'}));
    fireEvent.change(await screen.findByLabelText('Relatório'), {target: {value: 'operations'}});
    fireEvent.change(screen.getByLabelText('Frequência'), {target: {value: 'weekly'}});
    fireEvent.click(screen.getByRole('button', {name: 'Agendar'}));

    await waitFor(() =>
      expect(reportsService.createSchedule).toHaveBeenCalledWith({kind: 'operations', format: 'csv', frequency: 'weekly'}),
    );
  });

  it('shows the API message when a download fails', async () => {
    const body = new Blob([JSON.stringify({message: 'Muitas requisições'})]);
    // jsdom não implementa Blob.text(); o navegador sim.
    body.text ??= () =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(body);
      });
    vi.mocked(reportsService.download).mockRejectedValue({response: {data: body}});
    renderPage();
    fireEvent.click(within(screen.getByTestId('report-risk')).getByRole('button', {name: 'Gerar agora'}));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Não foi possível gerar o relatório', 'Muitas requisições'));
  });
});
