import {useEffect, useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {Skeleton} from '@/components/ui/skeleton';
import {
  Check,
  CircleDollarSign,
  RefreshCw,
  Star,
  Unlink,
  Wallet,
  Clock,
  AlertCircle,
  Info,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {api} from '@/server/api/api';
import useAppToast from '@/hooks/use-app-toast';
import {useNavigate} from 'react-router-dom';

// Lista de provedores suportados
const BROKERAGES = [
  {
    id: 'b3',
    name: 'B3',
    emoji: '🇧🇷',
    description: 'Relatório consolidado B3',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    emoji: '🏦',
    description: 'Nota de corretagem BTG',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'xp',
    name: 'XP Investimentos',
    emoji: '📈',
    description: 'Nota de corretagem XP',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'clear',
    name: 'Clear',
    emoji: '🔷',
    description: 'Nota de corretagem Clear',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'rico',
    name: 'Rico',
    emoji: '💚',
    description: 'Nota de corretagem Rico',
    type: 'brokerage',
    supportsUpload: true,
  },
  {
    id: 'nuinvest',
    name: 'NuInvest',
    emoji: '🟣',
    description: 'Nota de corretagem NuInvest',
    type: 'brokerage',
    supportsUpload: true,
  },
];

const CRYPTO_EXCHANGES = [
  {
    id: 'binance',
    name: 'Binance',
    emoji: '🟡',
    description: 'A maior exchange do mundo',
    type: 'crypto',
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    emoji: '🔵',
    description: 'Exchange americana premium',
    type: 'crypto',
  },
  {
    id: 'mercadobitcoin',
    name: 'Mercado Bitcoin',
    emoji: '🟠',
    description: 'Maior do Brasil',
    type: 'crypto',
  },
  {
    id: 'bitso',
    name: 'Bitso',
    emoji: '🟤',
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

const brokerSyncApi = {
  getConnections: () => api.get<Connection[]>('/broker-sync/connections'),
  connect: (data: any) => api.post('/broker-sync/connect', data),
  sync: (provider: string) => api.post(`/broker-sync/sync/${provider}`),
  disconnect: (provider: string) =>
    api.delete(`/broker-sync/disconnect/${provider}`),
  getUploads: () => api.get('/broker-sync/uploads'),
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
  const navigate = useNavigate();

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

  const hasConnection = (provider: string) =>
    connections.some((c) => c.provider === provider);

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
  }, [selectedProvider, connections]);

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
      // POST to broker-sync upload endpoint (mocked on backend)
      await api.post('/broker-sync/upload-note', formData, {
        headers: {'Content-Type': 'multipart/form-data'},
      });
      toast.success(
        'Nota enviada!',
        `Nota de ${provider.toUpperCase()} recebida e em processamento.`,
      );
      queryClient.invalidateQueries({queryKey: ['broker-connections']});
      queryClient.invalidateQueries({queryKey: ['broker-uploads']});
    } catch {
      toast.info(
        'Recebido',
        `Arquivo enviado. Processamento de nota de corretagem em desenvolvimento.`,
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
      <Card
        className={`overflow-hidden transition-all ${
          !linked ? 'cursor-pointer' : ''
        } ${
          !linked && selectedProvider === provider.id
            ? 'ring-2 ring-primary'
            : 'hover:bg-card/70'
        }`}
        onClick={() => !linked && setSelectedProvider(provider.id)}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              {provider.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{provider.name}</h3>
                {linked && (
                  <Badge
                    variant={
                      conn?.status === 'error' ? 'destructive' : 'default'
                    }
                    className="text-xs">
                    {conn?.status === 'error' ? 'Erro de sync' : 'Conectado'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {linked && conn?.lastSync
                  ? `Última sync: ${formatLastSync(conn.lastSync)}`
                  : linked && conn?.status === 'error'
                    ? conn?.lastError ||
                      'Conexão salva, mas a última sincronização falhou.'
                    : provider.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {linked ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Sincronizar"
                  disabled={syncing}
                  onClick={(e) => {
                    e.stopPropagation();
                    syncMutation.mutate(provider.id);
                  }}>
                  <RefreshCw
                    className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`}
                  />
                </Button>
                {/* Upload button for brokerages */}
                {'supportsUpload' in provider && provider.supportsUpload && (
                  <>
                    <input
                      type="file"
                      accept=".pdf,.csv,.xlsx,.xls"
                      id={`upload-${provider.id}`}
                      className="hidden"
                      onChange={(e) => handleBrokerageUpload(provider.id, e)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Upload Nota de Corretagem"
                      disabled={uploadProgress[provider.id]}
                      onClick={(e) => {
                        e.stopPropagation();
                        document
                          .getElementById(`upload-${provider.id}`)
                          ?.click();
                      }}>
                      {uploadProgress[provider.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Desconectar"
                  disabled={disconnecting}
                  onClick={(e) => {
                    e.stopPropagation();
                    disconnectMutation.mutate(provider.id);
                  }}>
                  <Unlink className="h-4 w-4 text-destructive" />
                </Button>
              </>
            ) : selectedProvider === provider.id ? (
              <Check className="h-5 w-5 text-primary" />
            ) : null}
          </div>
        </div>
      </Card>
    );
  };

  const ConnectForm = ({isBrokerage}: {isBrokerage: boolean}) => (
    <div className="mt-4 space-y-4 p-4 bg-card/30 rounded-lg border border-border/50">
      <h3 className="font-medium flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        Conectar {selectedProvider?.toUpperCase()}
      </h3>

      {isBrokerage ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cpf-connect">
              CPF (opcional – só para sincronização B3)
            </Label>
            <Input
              id="cpf-connect"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
            />
          </div>

          {/* Brokerage Note Upload */}
          {selectedProvider &&
            BROKERAGES.find((b) => b.id === selectedProvider)
              ?.supportsUpload && (
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">
                    Upload de Nota de Corretagem
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Faça upload direto da nota de corretagem (PDF, CSV ou XLSX). O
                  sistema extrai automaticamente os ativos, quantidades, preços
                  e datas.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,.csv,.xlsx,.xls"
                    id={`upload-form-${selectedProvider}`}
                    className="hidden"
                    onChange={(e) =>
                      handleBrokerageUpload(selectedProvider!, e)
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={uploadProgress[selectedProvider]}
                    onClick={() =>
                      document
                        .getElementById(`upload-form-${selectedProvider}`)
                        ?.click()
                    }>
                    {uploadProgress[selectedProvider] ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploadProgress[selectedProvider]
                      ? 'Enviando...'
                      : 'Selecionar Arquivo'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Aceita: nota_corretagem.pdf, extrato_corretora.csv,
                  relatorio_b3.xlsx
                </p>
              </div>
            )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="api-key">Chave API (somente leitura)</Label>
            <Input
              id="api-key"
              placeholder="Sua chave API"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-secret">Senha API</Label>
            <Input
              id="api-secret"
              type="password"
              placeholder="Sua senha API"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            Use apenas chaves com permissão de leitura. Nunca compartilhe
            credenciais de saques.
          </p>
        </>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => setSelectedProvider(null)}>
          Cancelar
        </Button>
        <Button onClick={handleConnect} disabled={connectMutation.isPending}>
          {connectMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            'Conectar'
          )}
        </Button>
      </div>
    </div>
  );

  const UpgradePlanModal = () => (
    <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary fill-primary" />
            Recurso Premium
          </DialogTitle>
          <DialogDescription>
            A sincronização automática de contas é um recurso disponível apenas
            nos planos Premium. Atualize agora para centralizar todo o seu
            patrimônio automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
            <h4 className="font-medium text-sm mb-1">Por que assinar?</h4>
            <ul className="text-xs space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary" /> Sincronização em
                tempo real com Binance e outras
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary" /> Insights avançados
                com Inteligência Artificial
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary" /> Suporte a notas de
                corretagem ilimitadas
              </li>
            </ul>
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between gap-2">
          <Button variant="ghost" onClick={() => setShowUpgradeModal(false)}>
            Agora não
          </Button>
          <Button onClick={() => navigate('/subscription')}>Ver Planos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container py-8 animate-fade-in">
      <UpgradePlanModal />
      <h1 className="text-3xl font-bold mb-2">Sincronizar Contas</h1>
      <p className="text-muted-foreground mb-6">
        Conecte corretoras e exchanges para centralizar seu portfólio
      </p>

      {/* Status das conexões */}
      {connections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{connections.length}</p>
              <p className="text-xs text-muted-foreground">Contas conectadas</p>
            </div>
          </Card>
          <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Última sincronização</p>
              <p className="text-xs text-muted-foreground">
                {connections[0]?.lastSync
                  ? formatLastSync(connections[0].lastSync)
                  : 'Nunca'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {uploads.length > 0 && (
        <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden mb-6">
          <CardHeader>
            <CardTitle>Processamento assíncrono de arquivos</CardTitle>
            <CardDescription>
              Acompanhe o status de uploads como `nota_corretagem.pdf` e
              `relatorio_b3.pdf`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {uploads.slice(0, 5).map((u: any) => (
              <div
                key={u._id}
                className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{u.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.provider} • {u.kind || 'brokerage_note'}
                  </p>
                </div>
                <Badge
                  variant={
                    u.status === 'processed'
                      ? 'default'
                      : u.status === 'failed'
                        ? 'destructive'
                        : 'secondary'
                  }>
                  {u.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden mb-8">
        <CardHeader>
          <CardTitle>Adicione suas contas</CardTitle>
          <CardDescription>
            Conecte corretoras e exchanges para analisar seus investimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="brokerages">Corretoras</TabsTrigger>
              <TabsTrigger value="crypto">Exchanges Cripto</TabsTrigger>
            </TabsList>

            <TabsContent value="brokerages">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            </TabsContent>

            <TabsContent value="crypto">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5 overflow-hidden">
        <CardHeader>
          <CardTitle>Sobre a integração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-3">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-2">Visualização Unificada</h3>
              <p className="text-sm text-muted-foreground">
                Reúna todos os seus investimentos em um único lugar.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center text-info mb-3">
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-2">Dados Atualizados</h3>
              <p className="text-sm text-muted-foreground">
                Sincronize e mantenha valores e preços em tempo real.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success mb-3">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-2">Análise Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Nossa IA analisa sua carteira e fornece insights personalizados.
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-card/30 rounded-lg">
            <h3 className="font-medium mb-2">🔒 Segurança em primeiro lugar</h3>
            <p className="text-sm text-muted-foreground">
              Usamos apenas permissões de leitura. Suas credenciais são
              criptografadas com AES-256 e nunca são compartilhadas com
              terceiros.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncAccounts;
