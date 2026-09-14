import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import AddAsset from './AddAsset';
import PortfolioService from '@/services/portfolio';
import {brokerSyncService} from '@/server/api/api';

vi.mock('@/services/portfolio', () => ({
  default: {
    getPortfolios: vi.fn(),
    importB3Auto: vi.fn(),
    addAssetToPortfolio: vi.fn(),
  },
}));

vi.mock('@/server/api/api', () => ({
  brokerSyncService: {
    getUploads: vi.fn(),
    getUploadStatus: vi.fn(),
    uploadNote: vi.fn(),
  },
}));

vi.mock('@/services/stocks', () => ({
  default: {getAllNacionalStocks: vi.fn(), getNationalStock: vi.fn()},
}));

const toastMock = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({toast: toastMock}),
}));

const xlsxFile = (name: string) =>
  new File(['x'], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

function renderPage() {
  const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AddAsset />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AddAsset — importação dos arquivos da B3', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (brokerSyncService.getUploads as any).mockResolvedValue({data: []});
    (PortfolioService.importB3Auto as any).mockResolvedValue({
      kind: 'report',
      assetsCreated: 16,
    });
  });

  // Regressão: a tela mandava os arquivos da B3 pro upload genérico de nota
  // (broker-sync), que falhava com "Portfolio validation failed: name" e
  // não entendia consolidado nem movimentação.
  it('sends every B3 spreadsheet to the auto importer of the user\'s only portfolio, not to the brokerage-note upload', async () => {
    (PortfolioService.getPortfolios as any).mockResolvedValue([
      {id: 'portfolio-1', name: 'Carteira consolidada'},
    ]);

    renderPage();
    await waitFor(() => expect(PortfolioService.getPortfolios).toHaveBeenCalled());

    const files = [
      xlsxFile('movimentacao-2026-08-25.xlsx'),
      xlsxFile('negociacao-2026-08-25.xlsx'),
      xlsxFile('relatorio-consolidado-anual-2025.xlsx'),
    ];
    // deixa a query de portfólios gravar o resultado antes do upload
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.change(screen.getByTestId('b3-file-input'), {target: {files}});

    await waitFor(() =>
      expect(PortfolioService.importB3Auto).toHaveBeenCalledTimes(3),
    );

    const calls = (PortfolioService.importB3Auto as any).mock.calls;
    expect(calls.every(([portfolioId]: [string]) => portfolioId === 'portfolio-1')).toBe(true);
    expect(calls[0][1].name).toBe('relatorio-consolidado-anual-2025.xlsx');
    expect(brokerSyncService.uploadNote).not.toHaveBeenCalled();
  });

  it('asks the user to pick a portfolio when there is more than one and none is selected', async () => {
    (PortfolioService.getPortfolios as any).mockResolvedValue([
      {id: 'p1', name: 'A'},
      {id: 'p2', name: 'B'},
    ]);

    renderPage();
    await waitFor(() => expect(PortfolioService.getPortfolios).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));

    fireEvent.change(screen.getByTestId('b3-file-input'), {
      target: {files: [xlsxFile('negociacao.xlsx')]},
    });

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({title: 'Escolha o portfólio'}),
      ),
    );
    expect(PortfolioService.importB3Auto).not.toHaveBeenCalled();
  });
});
