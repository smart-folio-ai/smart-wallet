import {describe, it, expect, beforeEach, vi} from 'vitest';
import {render, screen, fireEvent, waitFor, within} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import SyncAccounts from './SyncAccounts';
import {brokerSyncService} from '@/server/api/api';
import {useSubscription} from '@/hooks/useSubscription';
import {buildSyncLog, syncLogCsv} from '@/services/accounts/sync-sources';

const toast = {success: vi.fn(), error: vi.fn()};
vi.mock('@/hooks/use-app-toast', () => ({default: () => toast}));
vi.mock('@/hooks/useSubscription');
vi.mock('@/server/api/api', () => ({
  brokerSyncService: {getConnections: vi.fn(), getUploads: vi.fn(), connect: vi.fn(), sync: vi.fn(), disconnect: vi.fn()},
}));

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
      <MemoryRouter>
        <SyncAccounts />
      </MemoryRouter>
    </QueryClientProvider>,
  );

const card = (name: string) => screen.getAllByTestId('sync-source').find((el) => within(el).queryByRole('heading', {name}))!;

describe('SyncAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(brokerSyncService.getUploads).mockResolvedValue({data: [{_id: 'u1', provider: 'b3', originalName: 'posicao.xlsx', status: 'processed', createdAt: '2026-09-01T10:00:00Z'}]} as never);
    vi.mocked(brokerSyncService.getConnections).mockResolvedValue({
      data: [
        {id: 'c1', provider: 'binance', status: 'error', lastError: 'chave expirada'},
        {id: 'c2', provider: 'bitso', status: 'connected', lastSync: new Date().toISOString()},
      ],
    } as never);
  });

  describe('plano Pro', () => {
    beforeEach(() => vi.mocked(useSubscription).mockReturnValue({hasBrokerSync: true, isLoading: false} as never));

    it('shows each exchange with its real status and action', async () => {
      renderPage();

      await waitFor(() => expect(within(card('Binance')).getByText('Reautenticar')).toBeInTheDocument());
      expect(within(card('Binance')).getByRole('button', {name: 'Atualizar chave'})).toBeInTheDocument();
      expect(within(card('Bitso')).getByText('Conectada')).toBeInTheDocument();
      expect(within(card('Bitso')).getByRole('button', {name: 'Sincronizar agora'})).toBeInTheDocument();
      expect(within(card('Coinbase')).getByRole('button', {name: 'Conectar Coinbase'})).toBeInTheDocument();
      expect(screen.getByText('1 reautenticação')).toBeInTheDocument();
    });

    it('connects with a read-only key and runs the first sync', async () => {
      vi.mocked(brokerSyncService.connect).mockResolvedValue({data: {}} as never);
      vi.mocked(brokerSyncService.sync).mockResolvedValue({data: {syncedAssets: 3}} as never);
      renderPage();
      fireEvent.click(await within(card('Coinbase')).findByRole('button', {name: 'Conectar Coinbase'}));

      const dialog = await screen.findByRole('dialog', {name: 'Conectar conta · Coinbase'});
      fireEvent.change(within(dialog).getByLabelText('Chave de API'), {target: {value: 'key'}});
      fireEvent.change(within(dialog).getByLabelText('Secret'), {target: {value: 'secret'}});
      fireEvent.click(within(dialog).getByRole('button', {name: 'Conectar Coinbase'}));

      await waitFor(() => expect(brokerSyncService.connect).toHaveBeenCalledWith({provider: 'coinbase', apiKey: 'key', apiSecret: 'secret'}));
      await waitFor(() => expect(brokerSyncService.sync).toHaveBeenCalledWith('coinbase'));
      expect(toast.success).toHaveBeenCalledWith('Coinbase conectada', '3 ativos atualizados na sua carteira.');
    });
  });

  describe('fora do Pro', () => {
    beforeEach(() => vi.mocked(useSubscription).mockReturnValue({hasBrokerSync: false, isLoading: false} as never));

    it('offers B3 import to everyone but gates exchanges without calling the API', async () => {
      renderPage();

      expect(within(card('B3 · Área do investidor')).getByRole('button', {name: 'Importar arquivos da B3'})).toBeInTheDocument();
      expect(within(card('Binance')).getByRole('link', {name: 'Disponível no Pro'})).toHaveAttribute('href', '/subscription');
      expect(brokerSyncService.getConnections).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', {name: /Conectar nova conta/}));
      const dialog = await screen.findByRole('dialog', {name: 'Conectar conta · B3'});
      expect(within(dialog).getByRole('link', {name: 'Importar arquivos da B3'})).toHaveAttribute('href', '/add-asset');
    });
  });

  it('builds a quoted CSV log with BOM for Excel', () => {
    const csv = syncLogCsv(buildSyncLog([], [{_id: 'u', provider: 'b3', originalName: '=HYPERLINK()', status: 'failed', errorMessage: 'x'}]));
    expect(csv).toContain('"B3 · =HYPERLINK()";"falhou · x"');
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });
});
