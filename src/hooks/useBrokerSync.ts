import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {brokerSyncService} from '@/server/api/api';
import type {BrokerConnection, BrokerUpload, ExchangeId} from '@/services/accounts/sync-sources';

// Mesma chave do card de Configurações: conectar aqui atualiza lá.
const CONNECTIONS_KEY = ['broker-connections'] as const;
const UPLOADS_KEY = ['broker-uploads'] as const;

export function useBrokerConnections(enabled = true) {
  return useQuery<BrokerConnection[]>({
    queryKey: CONNECTIONS_KEY,
    queryFn: async () => (await brokerSyncService.getConnections()).data ?? [],
    enabled,
  });
}

export function useBrokerUploads() {
  return useQuery<BrokerUpload[]>({
    queryKey: UPLOADS_KEY,
    queryFn: async () => (await brokerSyncService.getUploads()).data ?? [],
  });
}

function useInvalidateAfterSync() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({queryKey: CONNECTIONS_KEY});
    queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
    queryClient.invalidateQueries({queryKey: ['portfolios']});
  };
}

export function useSyncExchange() {
  const invalidate = useInvalidateAfterSync();
  return useMutation({
    mutationFn: async (provider: ExchangeId) => (await brokerSyncService.sync(provider)).data as {syncedAssets?: number},
    onSettled: invalidate,
  });
}

/** Conecta e já faz a primeira leitura: é o que "Conectar" significa para quem clica. */
export function useConnectExchange() {
  const invalidate = useInvalidateAfterSync();
  return useMutation({
    mutationFn: async (input: {provider: ExchangeId; apiKey: string; apiSecret: string; apiPassphrase?: string}) => {
      await brokerSyncService.connect(input);
      return (await brokerSyncService.sync(input.provider)).data as {syncedAssets?: number};
    },
    onSettled: invalidate,
  });
}

export function useDisconnectExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: ExchangeId) => brokerSyncService.disconnect(provider),
    onSettled: () => queryClient.invalidateQueries({queryKey: CONNECTIONS_KEY}),
  });
}

/** Mensagem legível para os erros conhecidos da sincronização. */
export function syncErrorMessage(error: unknown): string {
  const raw = (error as {response?: {data?: {message?: string | string[]}}})?.response?.data?.message;
  const message = String(Array.isArray(raw) ? raw[0] : raw ?? '');
  if (message.includes('PLANO_UPGRADE_NECESSARIO')) return 'Conexão direta com corretora é do plano Pro.';
  if (message.includes('Limite de portfólios')) return 'Sua conta atingiu o limite de carteiras do plano.';
  if (/Invalid API-key|API-key format invalid/.test(message)) return 'A chave de API está inválida. Revise e tente novamente.';
  if (message.includes('Invalid signature')) return 'O secret está inválido. Revise e tente novamente.';
  if (message.includes('IP') && message.includes('whitelist')) return 'A chave tem restrição de IP. Ajuste a lista de IPs e tente novamente.';
  return message || 'Não foi possível concluir agora. Tente novamente em instantes.';
}
