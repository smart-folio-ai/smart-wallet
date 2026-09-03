import {useEffect, useState, useCallback} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '@/server/api/api';
import useAppToast from '@/hooks/use-app-toast';
import {useNavigate} from 'react-router-dom';

// Lista de provedores suportados
const BROKERAGES = [
  {
    id: 'b3',
    name: 'B3',
    icon: <i className="ph-fill ph-bank" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'Relatório consolidado B3',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    icon: <i className="ph-fill ph-briefcase" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'Nota de corretagem BTG',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'xp',
    name: 'XP Investimentos',
    icon: <i className="ph-fill ph-trend-up" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'Nota de corretagem XP',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'clear',
    name: 'Clear',
    icon: <i className="ph-fill ph-diamond" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'Nota de corretagem Clear',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'rico',
    name: 'Rico',
    icon: <i className="ph-fill ph-piggy-bank" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'Nota de corretagem Rico',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'nuinvest',
    name: 'NuInvest',
    icon: <i className="ph-fill ph-hexagon" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'Nota de corretagem NuInvest',
    type: 'brokerage',
    supportsUpload: true,
  },
];

const CRYPTO_EXCHANGES = [
  {
    id: 'binance',
    name: 'Binance',
    icon: <i className="ph-fill ph-bitcoin" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'A maior exchange do mundo',
    type: 'crypto',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    icon: <i className="ph-fill ph-coins" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'Exchange americana premium',
    type: 'crypto',
  },
  {
    id: 'mercadobitcoin',
    name: 'Mercado Bitcoin',
    icon: <i className="ph-fill ph-currency-circle-dollar" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'Maior do Brasil',
    type: 'crypto',
  },
  {
    id: 'bitso',
    name: 'Bitso',
    icon: <i className="ph-fill ph-wallet" style={{fontSize: 20, color: 'var(--ac)'}} />,
    description: 'Exchange Latino-americana',
    type: 'crypto',
  },
];

interface Connection {
  id: string;
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  hasCpf?: boolean;
  lastError?: string | null;
}

type SyncSuccessState = {
  open: boolean;
  providerId: string;
  providerName: string;
  syncedAssets: number;
};

interface BrokerageUploadStats {
  tradesImported?: number;
  assetsUpdated?: number;
  portfolioId?: string;
}

interface BrokerageUploadStatus {
  status: 'received' | 'queued' | 'processing' | 'processed' | 'failed';
  stats?: BrokerageUploadStats;
  errorMessage?: string | null;
}

const brokerSyncApi = {
  getConnections: () => api.get<Connection[]>('/broker-sync/connections'),
  connect: (data: any) => api.post('/broker-sync/connect', data),
  sync: (provider: string) => api.post(`/broker-sync/sync/${provider}`),
  disconnect: (provider: string) =>
    api.delete(`/broker-sync/disconnect/${provider}`),
  getUploads: () => api.get('/broker-sync/uploads'),
  getUploadStatus: (uploadId: string) =>
    api.get<BrokerageUploadStatus>(
      `/broker-sync/upload-note/${uploadId}/status`,
    ),
};

const SyncAccounts = () => {
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('brokerages');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [cpf, setCpf] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [uploadingProvider, setUploadingProvider] = useState<string | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>(
    {},
  );
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBrokerageNoteHelp, setShowBrokerageNoteHelp] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<SyncSuccessState>({
    open: false,
    providerId: '',
    providerName: '',
    syncedAssets: 0,
  });
  const navigate = useNavigate();

  const providerNameById = useCallback((providerId: string) => {
    const found = [...BROKERAGES, ...CRYPTO_EXCHANGES].find(
      (provider) => provider.id === providerId,
    );
    return found?.name || providerId;
  }, []);

  const openSyncSuccessModal = useCallback(
    (providerId: string, syncedAssets: number) => {
      setSyncSuccess({
        open: true,
        providerId,
        providerName: providerNameById(providerId),
        syncedAssets,
      });
    },
    [providerNameById],
  );

  const extractApiErrorMessage = (error: any): string => {
    const message = error?.response?.data?.message;
    if (Array.isArray(message)) {
      return String(message[0] || 'Erro inesperado');
    }
    if (typeof message === 'string') {
      return message;
    }
    return String(error?.message || 'Erro inesperado');
  };

  const normalizeSyncErrorMessage = (message: string): string => {
    const msg = String(message || '');
    if (msg.includes('PLANO_UPGRADE_NECESSARIO')) {
      return 'Seu plano atual não permite sincronização automática. Faça upgrade para continuar.';
    }
    if (msg.includes('Limite de portfólios atingido')) {
      return 'Não foi possível sincronizar porque sua conta atingiu o limite de carteiras do plano.';
    }
    if (
      msg.includes('Invalid API-key') ||
      msg.includes('API-key format invalid')
    ) {
      return 'A chave API da Binance está inválida. Revise a API Key e tente novamente.';
    }
    if (msg.includes('Invalid signature')) {
      return 'A Secret Key da Binance está inválida. Revise e tente novamente.';
    }
    if (msg.includes('IP') && msg.includes('whitelist')) {
      return 'A chave da Binance está com restrição de IP. Ajuste o whitelist e tente novamente.';
    }
    if (msg.includes('timestamp')) {
      return 'Falha de tempo na autenticação com a Binance. Aguarde alguns segundos e tente novamente.';
    }
    return msg;
  };

  // Busca conexões existentes
  const {data: connections = [], isLoading} = useQuery<Connection[]>({
    queryKey: ['broker-connections'],
    queryFn: async () => {
      try {
        const res = await brokerSyncApi.getConnections();
        return res.data || [];
      } catch {
        return [];
      }
    },
  });

  const {data: uploads = []} = useQuery<any[]>({
    queryKey: ['broker-uploads'],
    queryFn: async () => {
      try {
        const res = await brokerSyncApi.getUploads();
        return res.data || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const hasConnection = useCallback(
    (provider: string) => connections.some((c) => c.provider === provider),
    [connections],
  );

  const isConnected = (provider: string) =>
    connections.some(
      (c) => c.provider === provider && c.status === 'connected',
    );

  const getConnection = (provider: string) =>
    connections.find((c) => c.provider === provider);

  useEffect(() => {
    if (selectedProvider && hasConnection(selectedProvider)) {
      setSelectedProvider(null);
    }
  }, [selectedProvider, hasConnection]);

  // Mutation: conectar
  const connectMutation = useMutation({
    mutationFn: (data: any) => brokerSyncApi.connect(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: ['broker-connections']});
      toast.success(
        `${variables.provider} conectado!`,
        'Conta sincronizada com sucesso.',
      );
      setSelectedProvider(null);
      setCpf('');
      setApiKey('');
      setApiSecret('');
      if (
        CRYPTO_EXCHANGES.some((exchange) => exchange.id === variables.provider)
      ) {
        brokerSyncApi
          .sync(variables.provider)
          .then((res) => {
            queryClient.invalidateQueries({queryKey: ['broker-connections']});
            queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
            queryClient.invalidateQueries({queryKey: ['portfolios']});
            const count = res.data?.syncedAssets ?? 0;
            toast.success(
              'Sincronização concluída',
              `${count} ativos de ${variables.provider} foram atualizados na sua carteira.`,
            );
            openSyncSuccessModal(variables.provider, count);
          })
          .catch((error: any) => {
            const msg = normalizeSyncErrorMessage(
              extractApiErrorMessage(error),
            );
            if (msg.includes('PLANO_UPGRADE_NECESSARIO')) {
              setShowUpgradeModal(true);
              return;
            }
            toast.error('Conectado, mas sem sincronizar', msg);
          });
      }
    },
    onError: () => {
      toast.error(
        'Falha na conexão',
        'Não foi possível conectar essa conta agora. Revise os dados e tente novamente.',
      );
    },
  });

  // Mutation: sincronizar
  const syncMutation = useMutation({
    mutationFn: (provider: string) => brokerSyncApi.sync(provider),
    onSuccess: (res, provider) => {
      queryClient.invalidateQueries({queryKey: ['broker-connections']});
      queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
      queryClient.invalidateQueries({queryKey: ['portfolios']});

      const count = res.data?.syncedAssets ?? 0;
      toast.success(
        'Sincronização concluída',
        `${count} ativos de ${provider} foram atualizados na sua carteira.`,
      );
      openSyncSuccessModal(provider, count);
    },
    onError: (error: any) => {
      const msg = normalizeSyncErrorMessage(extractApiErrorMessage(error));
      if (msg.includes('PLANO_UPGRADE_NECESSARIO')) {
        setShowUpgradeModal(true);
      } else {
        toast.error('Erro', msg);
      }
    },
  });

  // Mutation: desconectar
  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => brokerSyncApi.disconnect(provider),
    onSuccess: (_data, provider) => {
      queryClient.invalidateQueries({queryKey: ['broker-connections']});
      toast.success('Desconectado', `Conta ${provider} removida.`);
    },
    onError: () => toast.error('Erro', 'Falha ao desconectar.'),
  });

  const handleConnect = () => {
    if (!selectedProvider) return;

    const isBrokerage = BROKERAGES.some((b) => b.id === selectedProvider);
    if (isBrokerage) {
      connectMutation.mutate({
        provider: selectedProvider,
        ...(cpf.trim() ? {cpf} : {}),
      });
    } else {
      if (!apiKey.trim() || !apiSecret.trim()) {
        toast.error('Campos obrigatórios', 'Preencha a chave API e senha.');
        return;
      }
      connectMutation.mutate({provider: selectedProvider, apiKey, apiSecret});
    }
  };

  const formatLastSync = (date?: string) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Faz polling do status de processamento de um upload de nota de corretagem
  // até ele virar `processed` ou `failed` (ou até estourar o timeout).
  const pollUploadStatus = useCallback(
    async (uploadId: string, provider: string) => {
      const POLL_INTERVAL_MS = 2500;
      const TIMEOUT_MS = 60000;
      const startedAt = Date.now();

      while (Date.now() - startedAt < TIMEOUT_MS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

        try {
          const res = await brokerSyncApi.getUploadStatus(uploadId);
          const status = res.data?.status;

          if (status === 'processed') {
            queryClient.invalidateQueries({queryKey: ['broker-connections']});
            queryClient.invalidateQueries({queryKey: ['broker-uploads']});
            queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
            queryClient.invalidateQueries({queryKey: ['portfolios']});
            const stats = res.data?.stats || {};
            toast.success(
              'Nota processada!',
              `${stats.tradesImported ?? 0} operação(ões) importada(s) e ${stats.assetsUpdated ?? 0} ativo(s) atualizado(s) para ${provider.toUpperCase()}.`,
            );
            return;
          }

          if (status === 'failed') {
            queryClient.invalidateQueries({queryKey: ['broker-uploads']});
            toast.error(
              'Falha ao processar nota',
              res.data?.errorMessage ||
                `Não foi possível processar a nota de ${provider.toUpperCase()}.`,
            );
            return;
          }
          // received | queued | processing: continua o polling
        } catch {
          // falha pontual de rede ao consultar status: tenta de novo até o timeout
        }
      }

      queryClient.invalidateQueries({queryKey: ['broker-uploads']});
      toast.info(
        'Processamento demorado',
        `O processamento da nota de ${provider.toUpperCase()} está demorando mais que o esperado. Acompanhe o status na lista de uploads.`,
      );
    },
    [queryClient, toast],
  );

  // Handle brokerage note upload
  const handleBrokerageUpload = async (
    provider: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress((prev) => ({...prev, [provider]: true}));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('provider', provider);
      // POST to broker-sync upload endpoint (processamento real, assíncrono)
      const res = await api.post('/broker-sync/upload-note', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      toast.success(
        'Nota enviada!',
        `Nota de ${provider.toUpperCase()} recebida e em processamento.`,
      );
      queryClient.invalidateQueries({queryKey: ['broker-connections']});
      queryClient.invalidateQueries({queryKey: ['broker-uploads']});

      const uploadId = res.data?.uploadId;
      if (uploadId) {
        // Não aguarda: o polling roda em background e notifica via toast
        // quando o processamento terminar (sucesso ou falha).
        void pollUploadStatus(String(uploadId), provider);
      }
    } catch {
      toast.error(
        'Falha no envio',
        'Não foi possível enviar o arquivo. Tente novamente.',
      );
    } finally {
      setUploadProgress((prev) => ({...prev, [provider]: false}));
      e.target.value = '';
    }
  };

  const ProviderCard = ({
    provider,
    type,
  }: {
    provider: (typeof BROKERAGES)[0] | (typeof CRYPTO_EXCHANGES)[0];
    type: 'brokerage' | 'crypto';
  }) => {
    const linked = hasConnection(provider.id);
    const conn = getConnection(provider.id);
    const syncing = syncMutation.isPending;
    const disconnecting = disconnectMutation.isPending;

    return (
      <div
        onClick={() => !linked && setSelectedProvider(provider.id)}
        style={{
          border: selectedProvider === provider.id && !linked
            ? '2px solid var(--ac)'
            : '1px solid var(--hair)',
          borderRadius: 14,
          background: 'var(--nk-card)',
          overflow: 'hidden',
          cursor: !linked ? 'pointer' : 'default',
          transition: 'border-color 0.2s',
        }}>
        <div style={{padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(145,132,217,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {provider.icon}
            </div>
            <div>
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <h3 style={{fontWeight: 500, margin: 0, fontSize: 14}}>{provider.name}</h3>
                {linked && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 500,
                    background: conn?.status === 'error' ? 'var(--badge-neg-bg)' : 'var(--badge-pos-bg)',
                    color: conn?.status === 'error' ? 'var(--neg)' : 'var(--pos)',
                  }}>
                    {conn?.status === 'error' ? 'Erro de sync' : 'Conectado'}
                  </span>
                )}
              </div>
              <p style={{fontSize: 12, color: 'var(--color-neutral-500)', margin: 0, marginTop: 2}}>
                {linked && conn?.lastSync
                  ? `Última sync: ${formatLastSync(conn.lastSync)}`
                  : linked && conn?.status === 'error'
                    ? conn?.lastError ||
                      'Conexão salva, mas a última sincronização falhou.'
                    : provider.description}
              </p>
            </div>
          </div>

          <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
            {linked ? (
              <>
                <button
                  type="button"
                  title="Sincronizar"
                  disabled={syncing}
                  onClick={(e) => {
                    e.stopPropagation();
                    syncMutation.mutate(provider.id);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid var(--hair)',
                    background: 'transparent',
                    cursor: syncing ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: syncing ? 0.5 : 1,
                    color: 'inherit',
                  }}>
                  <i className="ph-fill ph-arrows-clockwise" style={{fontSize: 16, animation: syncing ? 'spin 0.8s linear infinite' : undefined}} />
                </button>
                {/* Upload button for brokerages */}
                {'supportsUpload' in provider && provider.supportsUpload && (
                  <>
                    <input
                      type="file"
                      accept=".pdf,.csv,.xlsx,.xls"
                      id={`upload-${provider.id}`}
                      style={{display: 'none'}}
                      onChange={(e) => handleBrokerageUpload(provider.id, e)}
                    />
                    <button
                      type="button"
                      title="Upload Nota de Corretagem"
                      disabled={uploadProgress[provider.id]}
                      onClick={(e) => {
                        e.stopPropagation();
                        document
                          .getElementById(`upload-${provider.id}`)
                          ?.click();
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: '1px solid var(--hair)',
                        background: 'transparent',
                        cursor: uploadProgress[provider.id] ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: uploadProgress[provider.id] ? 0.5 : 1,
                        color: 'inherit',
                      }}>
                      {uploadProgress[provider.id] ? (
                        <i className="ph-fill ph-spinner" style={{fontSize: 16, animation: 'spin 0.8s linear infinite'}} />
                      ) : (
                        <i className="ph-fill ph-upload-simple" style={{fontSize: 16, color: 'var(--ac)'}} />
                      )}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  title="Desconectar"
                  disabled={disconnecting}
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectMutation.mutate(provider.id);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: '1px solid var(--hair)',
                    background: 'transparent',
                    cursor: disconnecting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: disconnecting ? 0.5 : 1,
                    color: 'inherit',
                  }}>
                  <i className="ph-fill ph-link-break" style={{fontSize: 16, color: 'var(--neg)'}} />
                </button>
              </>
            ) : selectedProvider === provider.id ? (
              <i className="ph-fill ph-check" style={{fontSize: 20, color: 'var(--ac)'}} />
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const ConnectForm = ({isBrokerage}: {isBrokerage: boolean}) => (
    <div style={{marginTop: 16, padding: 16, background: 'var(--surf-3)', borderRadius: 10, border: '1px solid var(--hair)'}}>
      <h3 style={{fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px 0', fontSize: 14}}>
        <i className="ph-fill ph-warning-circle" style={{fontSize: 16, color: 'var(--warn)'}} />
        Conectar {selectedProvider?.toUpperCase()}
      </h3>

      {isBrokerage ? (
        <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
            <label htmlFor="cpf-connect" style={{fontSize: 12, fontWeight: 500, color: 'var(--color-neutral-500)'}}>
              CPF (opcional – só para sincronização B3)
            </label>
            <input
              id="cpf-connect"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              style={{width: '100%', border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surf-3)', color: 'inherit', padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box'}}
            />
          </div>

          {/* Brokerage Note Upload */}
          {selectedProvider &&
            BROKERAGES.find((b) => b.id === selectedProvider)
              ?.supportsUpload && (
              <div style={{borderRadius: 10, border: '1px dashed var(--ac)', background: 'rgba(145,132,217,0.15)', padding: 16}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8}}>
                  <i className="ph-fill ph-file-text" style={{fontSize: 16, color: 'var(--ac)'}} />
                  <h4 style={{fontWeight: 500, fontSize: 13, margin: 0}}>
                    Upload de Nota de Corretagem
                  </h4>
                </div>
                <p style={{fontSize: 12, color: 'var(--color-neutral-500)', marginBottom: 12, margin: '0 0 12px 0'}}>
                  Faça upload direto da nota de corretagem (PDF, CSV ou XLSX). O
                  sistema extrai automaticamente os ativos, quantidades, preços
                  e datas.
                </p>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <input
                    type="file"
                    accept=".pdf,.csv,.xlsx,.xls"
                    id={`upload-form-${selectedProvider}`}
                    style={{display: 'none'}}
                    onChange={(e) =>
                      handleBrokerageUpload(selectedProvider!, e)
                    }
                  />
                  <button
                    type="button"
                    style={{
                      height: 36,
                      padding: '0 16px',
                      borderRadius: 8,
                      border: '1px solid var(--hair)',
                      background: 'transparent',
                      fontSize: 13,
                      cursor: uploadProgress[selectedProvider] ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      width: '100%',
                      justifyContent: 'center',
                      opacity: uploadProgress[selectedProvider] ? 0.5 : 1,
                      color: 'inherit',
                    }}
                    disabled={uploadProgress[selectedProvider]}
                    onClick={() =>
                      document
                        .getElementById(`upload-form-${selectedProvider}`)
                        ?.click()
                    }>
                    {uploadProgress[selectedProvider] ? (
                      <i className="ph-fill ph-spinner" style={{fontSize: 16, animation: 'spin 0.8s linear infinite'}} />
                    ) : (
                      <i className="ph-fill ph-upload-simple" style={{fontSize: 16}} />
                    )}
                    {uploadProgress[selectedProvider]
                      ? 'Enviando...'
                      : 'Selecionar Arquivo'}
                  </button>
                </div>
                <p style={{fontSize: 12, color: 'var(--color-neutral-500)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4}}>
                  <i className="ph-fill ph-info" style={{fontSize: 12}} />
                  Aceita: nota_corretagem.pdf, extrato_corretora.csv,
                  relatorio_b3.xlsx
                </p>
              </div>
            )}
        </div>
      ) : (
        <>
          <div style={{display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16}}>
            <label htmlFor="api-key" style={{fontSize: 12, fontWeight: 500, color: 'var(--color-neutral-500)'}}>Chave API (somente leitura)</label>
            <input
              id="api-key"
              placeholder="Sua chave API"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{width: '100%', border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surf-3)', color: 'inherit', padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box'}}
            />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16}}>
            <label htmlFor="api-secret" style={{fontSize: 12, fontWeight: 500, color: 'var(--color-neutral-500)'}}>Senha API</label>
            <input
              id="api-secret"
              type="password"
              placeholder="Sua senha API"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              style={{width: '100%', border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surf-3)', color: 'inherit', padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box'}}
            />
          </div>
          <p style={{fontSize: 12, color: 'var(--color-neutral-500)', display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 16}}>
            <i className="ph-fill ph-info" style={{fontSize: 12, marginTop: 2, flexShrink: 0}} />
            Use apenas chaves com permissão de leitura. Nunca compartilhe
            credenciais de saques.
          </p>
        </>
      )}

      <div style={{display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8}}>
        <button
          type="button"
          onClick={() => setSelectedProvider(null)}
          style={{height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'inherit'}}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConnect}
          disabled={connectMutation.isPending}
          style={{
            height: 36,
            padding: '0 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--grad-violet)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: connectMutation.isPending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: connectMutation.isPending ? 0.7 : 1,
          }}>
          {connectMutation.isPending ? (
            <>
              <i className="ph-fill ph-arrows-clockwise" style={{fontSize: 14, animation: 'spin 0.8s linear infinite'}} />
              Conectando...
            </>
          ) : (
            'Conectar'
          )}
        </button>
      </div>
    </div>
  );

  const tabDefs = [
    {id: 'brokerages', label: 'Corretoras'},
    {id: 'crypto', label: 'Exchanges Cripto'},
  ];

  return (
    <div className="min-h-screen p-2 md:p-6 relative overflow-hidden font-sans" style={{background: 'transparent', color: 'inherit'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {/* Background Glows */}
      <div style={{position: 'absolute', top: 0, left: 0, width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none', opacity: 0.4, background: 'radial-gradient(circle, rgba(145,132,217,0.15) 0%, transparent 70%)'}} />
      <div style={{position: 'absolute', bottom: 0, right: 0, width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none', opacity: 0.3, background: 'radial-gradient(circle, rgba(145,132,217,0.15) 0%, transparent 70%)'}} />

      <div style={{position: 'relative', zIndex: 10, maxWidth: 960, margin: '0 auto'}}>

        {/* UpgradePlanModal */}
        {showUpgradeModal && (
          <div
            style={{position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)'}}
            onClick={(e) => {if (e.target === e.currentTarget) setShowUpgradeModal(false);}}>
            <div style={{background: 'var(--nk-card)', border: '1px solid var(--hair)', borderRadius: 14, padding: 24, maxWidth: 440, width: '90%', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16}}>
              <h3 style={{fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8}}>
                <i className="ph-fill ph-star" style={{fontSize: 20, color: 'var(--ac)'}} />
                Recurso Premium
              </h3>
              <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                A sincronização automática de contas é um recurso disponível apenas
                nos planos Premium. Atualize agora para centralizar todo o seu
                patrimônio automaticamente.
              </p>
              <div style={{background: 'rgba(145,132,217,0.15)', padding: 16, borderRadius: 10, border: '1px solid rgba(145,132,217,0.35)'}}>
                <h4 style={{fontWeight: 500, fontSize: 13, margin: '0 0 8px 0'}}>Por que assinar?</h4>
                <ul style={{fontSize: 12, color: 'var(--color-neutral-500)', listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8}}>
                  <li style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <i className="ph-fill ph-check" style={{fontSize: 12, color: 'var(--ac)'}} /> Sincronização em
                    tempo real com Binance e outras
                  </li>
                  <li style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <i className="ph-fill ph-check" style={{fontSize: 12, color: 'var(--ac)'}} /> Insights avançados
                    com Inteligência Artificial
                  </li>
                  <li style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <i className="ph-fill ph-check" style={{fontSize: 12, color: 'var(--ac)'}} /> Suporte a notas de
                    corretagem ilimitadas
                  </li>
                </ul>
              </div>
              <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setShowUpgradeModal(false)}
                  style={{height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'inherit'}}>
                  Agora não
                </button>
                <button type="button" onClick={() => navigate('/subscription')}
                  style={{height: 38, padding: '0 16px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>
                  Ver Planos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BrokerageNoteHelpModal */}
        {showBrokerageNoteHelp && (
          <div
            style={{position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)'}}
            onClick={(e) => {if (e.target === e.currentTarget) setShowBrokerageNoteHelp(false);}}>
            <div style={{background: 'var(--nk-card)', border: '1px solid var(--hair)', borderRadius: 14, padding: 24, maxWidth: 600, width: '90%', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16}}>
              <h3 style={{fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, margin: 0}}>Por que subir nota de corretagem?</h3>
              <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                A nota de corretagem melhora a precisão da sua carteira e dos
                cálculos fiscais.
              </p>
              <div style={{display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--color-neutral-500)'}}>
                <p style={{margin: 0}}>
                  Quando você envia a nota, o sistema consegue identificar operações
                  reais de compra e venda com mais detalhe do que uma sincronização
                  simples de saldo.
                </p>
                <div>
                  <p style={{fontWeight: 500, color: 'inherit', marginBottom: 8, margin: '0 0 8px 0'}}>
                    O que melhora na prática:
                  </p>
                  <ul style={{listStyleType: 'disc', paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4}}>
                    <li>Preço médio correto por ativo e por movimentação.</li>
                    <li>
                      Quantidade atualizada com base em compras, vendas e ajustes.
                    </li>
                    <li>
                      Base fiscal mais confiável para apuração de IR e compensação de
                      prejuízo.
                    </li>
                    <li>
                      Histórico auditável das operações por data, ativo e corretora.
                    </li>
                    <li>
                      Menos risco de divergência entre carteira real e carteira no
                      app.
                    </li>
                  </ul>
                </div>
                <div style={{borderRadius: 10, border: '1px solid var(--hair)', padding: 12, background: 'var(--surf-3)'}}>
                  <p style={{fontWeight: 500, color: 'inherit', marginBottom: 4, margin: '0 0 4px 0'}}>
                    Segurança e uso dos dados
                  </p>
                  <p style={{margin: 0}}>
                    O arquivo é usado para extrair informações de movimentação (ativo,
                    quantidade, preço e data) e atualizar sua carteira. Não é
                    necessário compartilhar senha da corretora para esse processo.
                  </p>
                </div>
              </div>
              <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setShowBrokerageNoteHelp(false)}
                  style={{height: 38, padding: '0 16px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>
                  Entendi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SyncSuccessModal */}
        {syncSuccess.open && (
          <div
            style={{position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)'}}
            onClick={(e) => {if (e.target === e.currentTarget) setSyncSuccess((prev) => ({...prev, open: false}));}}>
            <div style={{background: 'var(--nk-card)', border: '1px solid var(--hair)', borderRadius: 14, padding: 24, maxWidth: 440, width: '90%', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: 16}}>
              <h3 style={{fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, margin: 0}}>Sincronização bem-sucedida</h3>
              <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                {syncSuccess.providerName} sincronizado com sucesso.
              </p>
              <div style={{borderRadius: 10, border: '1px solid var(--hair)', background: 'var(--surf-3)', padding: 16, display: 'flex', flexDirection: 'column', gap: 8}}>
                <p style={{fontSize: 13, margin: 0}}>
                  {syncSuccess.syncedAssets} ativo(s) foram atualizados para a
                  carteira{' '}
                  <span style={{fontWeight: 600}}>{syncSuccess.providerName}</span>.
                </p>
                <p style={{fontSize: 12, color: 'var(--color-neutral-500)', margin: 0}}>
                  Você já pode ver seus ativos em{' '}
                  <span style={{fontWeight: 600}}>Portfólio</span>, selecionando a
                  carteira da {syncSuccess.providerName}.
                </p>
              </div>
              <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setSyncSuccess((prev) => ({...prev, open: false}))}
                  style={{height: 38, padding: '0 16px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', fontSize: 13, cursor: 'pointer', color: 'inherit'}}>
                  Fechar
                </button>
                <button type="button"
                  onClick={() => {
                    setSyncSuccess((prev) => ({...prev, open: false}));
                    navigate('/portfolio');
                  }}
                  style={{height: 38, padding: '0 16px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}>
                  Ver no Portfólio
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', marginBottom: 32}}>
          <h1 style={{fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.5px', margin: '0 0 8px 0'}}>
            Sincronizar Contas
          </h1>
          <p style={{fontSize: 14, color: 'var(--color-neutral-500)', margin: 0}}>
            Conecte corretoras e exchanges para centralizar seu portfólio de
            forma rápida e segura.
          </p>
        </div>

        {/* Status das conexões */}
        {connections.length > 0 && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24}}>
            <div style={{borderRadius: 16, background: 'var(--nk-card)', border: '1px solid var(--hair)', boxShadow: 'var(--shadow-sm)', padding: 24, display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{width: 40, height: 40, borderRadius: '50%', background: 'rgba(47,214,163,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <i className="ph-fill ph-check" style={{fontSize: 20, color: 'var(--pos)'}} />
              </div>
              <div>
                <p style={{fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-heading)', margin: 0}}>
                  {connections.length}
                </p>
                <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                  Contas conectadas
                </p>
              </div>
            </div>
            <div style={{borderRadius: 16, background: 'var(--nk-card)', border: '1px solid var(--hair)', boxShadow: 'var(--shadow-sm)', padding: 24, display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{width: 48, height: 48, borderRadius: 12, background: 'rgba(145,132,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <i className="ph-fill ph-clock" style={{fontSize: 24, color: 'var(--ac)'}} />
              </div>
              <div>
                <p style={{fontSize: 15, fontWeight: 500, fontFamily: 'var(--font-heading)', margin: 0}}>
                  Última sincronização
                </p>
                <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                  {connections[0]?.lastSync
                    ? formatLastSync(connections[0].lastSync)
                    : 'Nunca'}
                </p>
              </div>
            </div>
          </div>
        )}

        {connections.length > 0 && (
          <div style={{border: '1px solid var(--hair)', borderRadius: 16, background: 'var(--nk-card)', overflow: 'hidden', marginBottom: 32}}>
            <div style={{padding: '16px 20px', borderBottom: '1px solid var(--hair-soft)'}}>
              <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, margin: '0 0 4px 0'}}>
                Status de sincronização por conexão
              </h2>
              <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                Última sincronização e status atual de cada conta conectada.
              </p>
            </div>
            <div style={{padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8}}>
              {connections.map((c) => {
                const isError = c.status === 'error';
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderRadius: 10,
                      border: `1px solid ${isError ? 'var(--neg)' : 'var(--hair)'}`,
                      padding: 12,
                    }}>
                    <div style={{minWidth: 0}}>
                      <p style={{fontSize: 13, fontWeight: 500, margin: 0}}>
                        {providerNameById(c.provider)}
                      </p>
                      <p style={{fontSize: 12, color: 'var(--color-neutral-500)', margin: '2px 0 0 0'}}>
                        Última sync: {formatLastSync(c.lastSync)}
                      </p>
                      {isError && c.lastError && (
                        <p style={{fontSize: 12, color: 'var(--neg)', margin: '4px 0 0 0'}}>
                          {c.lastError}
                        </p>
                      )}
                    </div>
                    <span style={{
                      flexShrink: 0,
                      padding: '2px 8px',
                      borderRadius: 5,
                      fontSize: 11,
                      fontWeight: 500,
                      background: isError ? 'var(--badge-neg-bg)' : 'var(--badge-pos-bg)',
                      color: isError ? 'var(--neg)' : 'var(--pos)',
                    }}>
                      {isError ? 'Erro de sync' : c.status === 'connected' ? 'Conectado' : c.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {uploads.length > 0 && (
          <div style={{border: '1px solid var(--hair)', borderRadius: 16, background: 'var(--nk-card)', overflow: 'hidden', marginBottom: 32}}>
            <div style={{padding: '16px 20px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12}}>
              <div>
                <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, margin: '0 0 4px 0'}}>
                  Processamento assíncrono de arquivos
                </h2>
                <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                  Acompanhe o status de uploads como `nota_corretagem.pdf` e
                  `relatorio_b3.xlsx`.
                </p>
              </div>
              <button
                type="button"
                aria-label="Entender nota de corretagem"
                title="Por que subir nota de corretagem?"
                onClick={() => setShowBrokerageNoteHelp(true)}
                style={{flexShrink: 0, width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--hair)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit'}}>
                <i className="ph-fill ph-question" style={{fontSize: 16}} />
              </button>
            </div>
            <div style={{padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8}}>
              {uploads.slice(0, 5).map((u: any) => (
                <div
                  key={u._id}
                  style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, border: '1px solid var(--hair)', padding: 12}}>
                  <div>
                    <p style={{fontSize: 13, fontWeight: 500, margin: 0}}>{u.originalName}</p>
                    <p style={{fontSize: 12, color: 'var(--color-neutral-500)', margin: 0}}>
                      {u.provider} • {u.kind || 'brokerage_note'}
                    </p>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 5,
                    fontSize: 11,
                    fontWeight: 500,
                    background: u.status === 'processed'
                      ? 'var(--badge-pos-bg)'
                      : u.status === 'failed'
                        ? 'var(--badge-neg-bg)'
                        : 'var(--surf-3)',
                    color: u.status === 'processed'
                      ? 'var(--pos)'
                      : u.status === 'failed'
                        ? 'var(--neg)'
                        : 'var(--color-neutral-400)',
                  }}>
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add accounts card */}
        <div style={{border: '1px solid var(--hair)', borderRadius: 16, background: 'var(--nk-card)', overflow: 'hidden', marginBottom: 32}}>
          <div style={{padding: '24px 20px 20px', borderBottom: '1px solid var(--hair-soft)'}}>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', margin: '0 0 4px 0'}}>
              Adicione suas contas
            </h2>
            <p style={{fontSize: 14, color: 'var(--color-neutral-500)', margin: 0}}>
              Conecte corretoras e exchanges para analisar seus investimentos
            </p>
          </div>
          <div style={{padding: '20px'}}>
            {/* Tab switcher */}
            <div style={{display: 'flex', gap: 4, background: 'var(--surf-3)', borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 24}}>
              {tabDefs.map(({id, label}) => (
                <button key={id} type="button" onClick={() => setActiveTab(id as any)}
                  style={{padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    background: activeTab === id ? 'var(--ac)' : 'transparent',
                    color: activeTab === id ? '#fff' : 'var(--color-neutral-400)'}}>
                  {label}
                </button>
              ))}
            </div>

            {/* Brokerages tab */}
            {activeTab === 'brokerages' && (
              <>
                {isLoading ? (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16}}>
                    {[1, 2].map((i) => (
                      <div key={i} style={{height: 80, borderRadius: 10, background: 'var(--surf-3)'}} />
                    ))}
                  </div>
                ) : (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16}}>
                    {BROKERAGES.map((b) => (
                      <ProviderCard key={b.id} provider={b} type="brokerage" />
                    ))}
                  </div>
                )}
                {selectedProvider &&
                  BROKERAGES.some((b) => b.id === selectedProvider) &&
                  !hasConnection(selectedProvider) && (
                    <ConnectForm isBrokerage={true} />
                  )}
              </>
            )}

            {/* Crypto tab */}
            {activeTab === 'crypto' && (
              <>
                {isLoading ? (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16}}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{height: 80, borderRadius: 10, background: 'var(--surf-3)'}} />
                    ))}
                  </div>
                ) : (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16}}>
                    {CRYPTO_EXCHANGES.map((e) => (
                      <ProviderCard key={e.id} provider={e} type="crypto" />
                    ))}
                  </div>
                )}
                {selectedProvider &&
                  CRYPTO_EXCHANGES.some((e) => e.id === selectedProvider) &&
                  !hasConnection(selectedProvider) && (
                    <ConnectForm isBrokerage={false} />
                  )}
              </>
            )}
          </div>
        </div>

        {/* About card */}
        <div style={{border: '1px solid var(--hair)', borderRadius: 16, background: 'var(--nk-card)', overflow: 'hidden'}}>
          <div style={{padding: '16px 20px', borderBottom: '1px solid var(--hair-soft)'}}>
            <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, margin: 0}}>Sobre a integração</h2>
          </div>
          <div style={{padding: '20px'}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24}}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                <div style={{width: 48, height: 48, borderRadius: '50%', background: 'rgba(145,132,217,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12}}>
                  <i className="ph-fill ph-wallet" style={{fontSize: 24, color: 'var(--ac)'}} />
                </div>
                <h3 style={{fontWeight: 500, margin: '0 0 8px 0', fontSize: 14}}>Visualização Unificada</h3>
                <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                  Reúna todos os seus investimentos em um único lugar.
                </p>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                <div style={{width: 48, height: 48, borderRadius: '50%', background: 'rgba(76,201,240,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12}}>
                  <i className="ph-fill ph-currency-circle-dollar" style={{fontSize: 24, color: 'var(--ac)'}} />
                </div>
                <h3 style={{fontWeight: 500, margin: '0 0 8px 0', fontSize: 14}}>Dados Atualizados</h3>
                <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                  Sincronize e mantenha valores e preços em tempo real.
                </p>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                <div style={{width: 48, height: 48, borderRadius: '50%', background: 'rgba(47,214,163,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12}}>
                  <i className="ph-fill ph-star" style={{fontSize: 24, color: 'var(--pos)'}} />
                </div>
                <h3 style={{fontWeight: 500, margin: '0 0 8px 0', fontSize: 14}}>Análise Inteligente</h3>
                <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                  Nossa IA analisa sua carteira e fornece insights
                  personalizados.
                </p>
              </div>
            </div>
            <div style={{marginTop: 24, padding: 16, background: 'var(--surf-3)', borderRadius: 10}}>
              <h3 style={{fontWeight: 500, margin: '0 0 8px 0', fontSize: 14}}>
                🔒 Segurança em primeiro lugar
              </h3>
              <p style={{fontSize: 13, color: 'var(--color-neutral-500)', margin: 0}}>
                Usamos apenas permissões de leitura. Suas credenciais são
                criptografadas com AES-256 e nunca são compartilhadas com
                terceiros.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncAccounts;
