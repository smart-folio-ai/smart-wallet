import {useState} from 'react';
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
// import { connectionsService } from "@/lib/api";
import {useToast} from '@/hooks/use-toast';
import {
  Check,
  CircleDollarSign,
  RefreshCw,
  Star,
  Unlink,
  Wallet,
} from 'lucide-react';

// Mock data para brokerages e exchanges
const brokerages = [
  {id: 'b3', name: 'B3', logo: '🇧🇷', connected: false},
  {id: 'xp', name: 'XP Investimentos', logo: 'XP', connected: false},
  {id: 'clear', name: 'Clear', logo: 'C', connected: false},
  {id: 'nuinvest', name: 'NuInvest', logo: 'NU', connected: false},
];

const cryptoExchanges = [
  {
    id: 'binance',
    name: 'Binance',
    logo: 'B',
    connected: true,
    lastSync: '2023-06-10T14:30:00Z',
  },
  {id: 'coinbase', name: 'Coinbase', logo: 'CB', connected: false},
  {id: 'mercadobitcoin', name: 'Mercado Bitcoin', logo: 'MB', connected: false},
  {id: 'bitso', name: 'Bitso', logo: 'BT', connected: false},
];

const SyncAccounts = () => {
  const {toast} = useToast();
  const [activeTab, setActiveTab] = useState('brokerages');
  const [connecting, setConnecting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!selectedProvider || !apiKey || !apiSecret) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos necessários.',
        variant: 'destructive',
      });
      return;
    }

    setConnecting(true);

    // Simulating API call
    setTimeout(() => {
      setConnecting(false);
      setApiKey('');
      setApiSecret('');
      setSelectedProvider(null);

      toast({
        title: 'Conta conectada',
        description: 'Sua conta foi conectada com sucesso.',
      });

      // When real API is ready:
      // try {
      //   await connectionsService.connectAccount(selectedProvider, {
      //     apiKey,
      //     apiSecret,
      //   });
      //   setApiKey("");
      //   setApiSecret("");
      //   setSelectedProvider(null);
      //   toast({
      //     title: "Conta conectada",
      //     description: "Sua conta foi conectada com sucesso.",
      //   });
      // } catch (error) {
      //   console.error("Failed to connect account", error);
      //   toast({
      //     title: "Erro",
      //     description: "Falha ao conectar a conta. Verifique suas credenciais.",
      //     variant: "destructive",
      //   });
      // } finally {
      //   setConnecting(false);
      // }
    }, 2000);
  };

  const handleSync = (providerId: string) => {
    toast({
      title: 'Sincronizando...',
      description: 'Sincronizando dados da sua conta.',
    });

    // When real API is ready:
    // try {
    //   await connectionsService.syncConnection(providerId);
    //   toast({
    //     title: "Sincronização concluída",
    //     description: "Seus dados foram atualizados com sucesso.",
    //   });
    // } catch (error) {
    //   console.error("Failed to sync account", error);
    //   toast({
    //     title: "Erro",
    //     description: "Falha ao sincronizar a conta.",
    //     variant: "destructive",
    //   });
    // }
  };

  const handleDisconnect = (providerId: string) => {
    toast({
      title: 'Conta desconectada',
      description: 'Sua conta foi desconectada com sucesso.',
    });

    // When real API is ready:
    // try {
    //   await connectionsService.removeConnection(providerId);
    //   toast({
    //     title: "Conta desconectada",
    //     description: "Sua conta foi desconectada com sucesso.",
    //   });
    // } catch (error) {
    //   console.error("Failed to disconnect account", error);
    //   toast({
    //     title: "Erro",
    //     description: "Falha ao desconectar a conta.",
    //     variant: "destructive",
    //   });
    // }
  };

  return (
    <div className="container py-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Sincronizar Contas</h1>

      <Card className="card-gradient mb-8">
        <CardHeader>
          <CardTitle>Adicione suas contas</CardTitle>
          <CardDescription>
            Conecte suas contas de corretoras e exchanges para analisar seus
            investimentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="brokerages">Corretoras</TabsTrigger>
              <TabsTrigger value="crypto">Exchanges de Cripto</TabsTrigger>
              <TabsTrigger value="manual">Adicionar Manualmente</TabsTrigger>
            </TabsList>

            <TabsContent value="brokerages">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {brokerages.map((broker) => (
                  <Card
                    key={broker.id}
                    className={`overflow-hidden transition-all cursor-pointer ${
                      selectedProvider === broker.id
                        ? 'ring-2 ring-primary'
                        : 'hover:bg-card/70'
                    }`}
                    onClick={() => setSelectedProvider(broker.id)}>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3">
                          {broker.logo}
                        </div>
                        <div>
                          <h3 className="font-medium">{broker.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {broker.connected ? 'Conectado' : 'Não conectado'}
                          </p>
                        </div>
                      </div>
                      {selectedProvider === broker.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {selectedProvider && (
                <div className="space-y-4 p-4 bg-card/30 rounded-lg">
                  <h3 className="font-medium">Conectar conta</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="apiKey">Chave API</Label>
                      <Input
                        id="apiKey"
                        placeholder="Insira sua chave API"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="apiSecret">Senha API</Label>
                      <Input
                        id="apiSecret"
                        type="password"
                        placeholder="Insira sua senha API"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProvider(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleConnect} disabled={connecting}>
                      {connecting ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>Conectar</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="crypto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {cryptoExchanges.map((exchange) => (
                  <Card
                    key={exchange.id}
                    className={`overflow-hidden transition-all ${
                      exchange.connected
                        ? ''
                        : 'cursor-pointer hover:bg-card/70'
                    } ${
                      !exchange.connected && selectedProvider === exchange.id
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() =>
                      !exchange.connected && setSelectedProvider(exchange.id)
                    }>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold mr-3">
                          {exchange.logo}
                        </div>
                        <div>
                          <h3 className="font-medium">{exchange.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {exchange.connected ? (
                              <>
                                Conectado • Última sincronização:{' '}
                                {new Date(exchange.lastSync).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </>
                            ) : (
                              'Não conectado'
                            )}
                          </p>
                        </div>
                      </div>
                      {exchange.connected ? (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSync(exchange.id);
                            }}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect(exchange.id);
                            }}>
                            <Unlink className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        selectedProvider === exchange.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {selectedProvider &&
                !cryptoExchanges.find((e) => e.id === selectedProvider)
                  ?.connected && (
                  <div className="space-y-4 p-4 bg-card/30 rounded-lg">
                    <h3 className="font-medium">Conectar conta</h3>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="cryptoApiKey">Chave API</Label>
                        <Input
                          id="cryptoApiKey"
                          placeholder="Insira sua chave API"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cryptoApiSecret">Senha API</Label>
                        <Input
                          id="cryptoApiSecret"
                          type="password"
                          placeholder="Insira sua senha API"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedProvider(null)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleConnect} disabled={connecting}>
                        {connecting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Conectando...
                          </>
                        ) : (
                          <>Conectar</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="manual">
              <div className="space-y-6 p-4 bg-card/30 rounded-lg">
                <h3 className="font-medium">Adicionar ativo manualmente</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="assetType">Tipo de Ativo</Label>
                      <select
                        id="assetType"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                        <option value="">Selecione...</option>
                        <option value="stock">Ações</option>
                        <option value="fii">FIIs</option>
                        <option value="crypto">Criptomoedas</option>
                        <option value="other">Outros</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assetSymbol">Símbolo/Ticker</Label>
                      <Input
                        id="assetSymbol"
                        placeholder="Ex: PETR4, BTC, HGLG11"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="assetAmount">Quantidade</Label>
                      <Input id="assetAmount" type="number" placeholder="0" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="assetPrice">Preço de Compra</Label>
                      <Input id="assetPrice" type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assetDate">Data da Compra</Label>
                    <Input id="assetDate" type="date" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline">Limpar</Button>
                  <Button>Adicionar Ativo</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="card-gradient">
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
                Reúna todos os seus investimentos em um único lugar para uma
                visão completa da sua carteira.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center text-info mb-3">
                <CircleDollarSign className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-2">Dados em Tempo Real</h3>
              <p className="text-sm text-muted-foreground">
                Conecte suas contas e mantenha-se atualizado com os preços e
                valores em tempo real.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success mb-3">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="font-medium mb-2">Análise Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Nossa IA analisa sua carteira para fornecer insights
                personalizados e recomendações.
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-card/30 rounded-lg">
            <h3 className="font-medium mb-2">Nota sobre segurança</h3>
            <p className="text-sm text-muted-foreground">
              Utilizamos apenas permissões de leitura para acessar suas contas.
              Suas chaves API são criptografadas e não armazenamos senhas ou
              informações sensíveis. Para maior segurança, recomendamos criar
              chaves API somente com permissão de leitura.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncAccounts;
