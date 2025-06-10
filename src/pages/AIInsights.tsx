import {useEffect, useState} from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
// import { aiService } from "@/lib/api";
import {useToast} from '@/hooks/use-toast';
import {
  ArrowDown,
  ArrowUp,
  BadgeInfo,
  Check,
  ChevronRight,
  Lock,
  Star,
  Zap,
} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import {Progress} from '@/components/ui/progress';

// Mock data para insights
const mockInsights = {
  portfolio: {
    riskLevel: 'Moderado',
    diversification: 65,
    expectedReturn: 12.5,
    volatility: 18.2,
    recommendations: [
      {
        id: '1',
        type: 'diversification',
        title: 'Aumente sua diversificação',
        description:
          'Sua carteira está concentrada em ações do setor financeiro. Considere adicionar exposição em outros setores.',
        premium: false,
      },
      {
        id: '2',
        type: 'risk',
        title: 'Reduza a volatilidade',
        description:
          'Adicione ativos de renda fixa para equilibrar a volatilidade de sua carteira.',
        premium: false,
      },
      {
        id: '3',
        type: 'optimization',
        title: 'Otimize seus rendimentos',
        description:
          'Análise detalhada de otimização de carteira com base no seu perfil de risco.',
        premium: true,
      },
    ],
  },
  assets: [
    {
      id: '1',
      symbol: 'PETR4',
      name: 'Petrobras',
      currentPrice: 30.45,
      targetPrice: 36.8,
      recommendation: 'compra',
      strength: 85,
      premium: false,
    },
    {
      id: '2',
      symbol: 'VALE3',
      name: 'Vale',
      currentPrice: 65.7,
      targetPrice: 73.2,
      recommendation: 'compra',
      strength: 70,
      premium: false,
    },
    {
      id: '3',
      symbol: 'BTC',
      name: 'Bitcoin',
      currentPrice: 225000.0,
      targetPrice: 260000.0,
      recommendation: 'manter',
      strength: 60,
      premium: false,
    },
    {
      id: '4',
      symbol: 'ITUB4',
      name: 'Itaú Unibanco',
      currentPrice: 32.5,
      targetPrice: 28.9,
      recommendation: 'venda',
      strength: 65,
      premium: true,
    },
    {
      id: '5',
      symbol: 'ETH',
      name: 'Ethereum',
      currentPrice: 12500.0,
      targetPrice: 15000.0,
      recommendation: 'compra',
      strength: 80,
      premium: true,
    },
  ],
  market: {
    sentiment: 'neutro',
    trendingSectors: [
      {name: 'Tecnologia', trend: 'positivo', premium: false},
      {name: 'Energia', trend: 'positivo', premium: false},
      {name: 'Financeiro', trend: 'neutro', premium: true},
      {name: 'Saúde', trend: 'negativo', premium: true},
    ],
    opportunities: [
      {
        id: '1',
        title: 'Empresas de energia renovável',
        description:
          'Perspectivas positivas para empresas do setor de energia renovável devido a novos incentivos governamentais.',
        premium: true,
      },
      {
        id: '2',
        title: 'Oportunidades em cripto',
        description:
          'Análise de altcoins promissoras com potencial de valorização.',
        premium: true,
      },
    ],
  },
};

type Recommendation = {
  id: string;
  type: 'diversification' | 'risk' | 'optimization';
  title: string;
  description: string;
  premium: boolean;
};

type Asset = {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  targetPrice: number;
  recommendation: 'compra' | 'manter' | 'venda';
  strength: number;
  premium: boolean;
};

type TrendingSector = {
  name: string;
  trend: 'positivo' | 'negativo' | 'neutro';
  premium: boolean;
};

type Opportunity = {
  id: string;
  title: string;
  description: string;
  premium: boolean;
};

type Insights = {
  portfolio: {
    riskLevel: string;
    diversification: number;
    expectedReturn: number;
    volatility: number;
    recommendations: Recommendation[];
  };
  assets: Asset[];
  market: {
    sentiment: 'positivo' | 'negativo' | 'neutro';
    trendingSectors: TrendingSector[];
    opportunities: Opportunity[];
  };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const recommendationColors = {
  compra: 'default',
  manter: 'secondary',
  venda: 'destructive',
} as const;

const AIInsights = () => {
  const {toast} = useToast();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Simulating API call with mock data
    setTimeout(() => {
      setInsights(mockInsights as unknown as Insights);
      setLoading(false);
    }, 1500);

    // When real API is ready:
    // const fetchInsights = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await aiService.getInsights();
    //     setInsights(response.data);
    //   } catch (error) {
    //     console.error("Failed to fetch AI insights", error);
    //     toast({
    //       title: "Erro",
    //       description: "Falha ao carregar insights da IA",
    //       variant: "destructive",
    //     });
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchInsights();
  }, []);

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Análise de IA</h1>
        <Badge
          variant={isPremium ? 'default' : 'outline'}
          className="px-3 py-1">
          {isPremium ? (
            <span className="flex items-center">
              <Star className="h-4 w-4 mr-1 text-yellow-400" />
              Premium
            </span>
          ) : (
            <span className="flex items-center">Free</span>
          )}
        </Badge>
      </div>

      {/* Upgrade Banner */}
      {!isPremium && (
        <Card className="mb-8 bg-gradient-to-r from-primary/90 to-info/90 text-white border-none overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="col-span-2">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Desbloqueie o poder da análise de IA
                </h2>
                <p className="mb-4">
                  Faça upgrade para o plano Premium e obtenha análises
                  detalhadas, recomendações personalizadas, alertas de
                  oportunidades e muito mais.
                </p>
                <div className="flex items-center space-x-4">
                  <Check className="h-5 w-5" />
                  <span>Análise completa de ativos</span>
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <Check className="h-5 w-5" />
                  <span>Recomendações de compra e venda</span>
                </div>
                <div className="flex items-center space-x-4 mt-1 mb-4">
                  <Check className="h-5 w-5" />
                  <span>Alertas de oportunidades em tempo real</span>
                </div>
              </div>
              <div className="flex justify-center md:justify-end">
                <Button
                  variant="secondary"
                  size="lg"
                  className="font-medium"
                  onClick={() =>
                    toast({
                      title: 'Aguarde',
                      description: 'Recursos de assinatura em breve!',
                    })
                  }>
                  Upgrade para Premium
                </Button>
              </div>
            </div>
          </CardContent>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl" />
        </Card>
      )}

      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="portfolio">Sua Carteira</TabsTrigger>
          <TabsTrigger value="assets">Seus Ativos</TabsTrigger>
          <TabsTrigger value="market">Mercado</TabsTrigger>
        </TabsList>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {loading ? (
              <>
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </>
            ) : (
              <>
                <Card className="card-gradient">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Nível de Risco</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-24">
                      <span className="text-2xl font-bold text-primary mb-2">
                        {insights.portfolio.riskLevel}
                      </span>
                      <div className="w-full mt-2">
                        <Progress
                          value={insights.portfolio.volatility}
                          max={40}
                          className="h-2"
                        />
                      </div>
                      <div className="flex justify-between w-full mt-1 text-xs text-muted-foreground">
                        <span>Baixo</span>
                        <span>Moderado</span>
                        <span>Alto</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-gradient">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Diversificação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-24">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl font-bold">
                          {insights.portfolio.diversification}%
                        </span>
                        <Badge
                          className="ml-2 bg-info text-white"
                          variant="secondary">
                          Bom
                        </Badge>
                      </div>
                      <div className="w-full mt-2">
                        <Progress
                          value={insights.portfolio.diversification}
                          className="h-2"
                        />
                      </div>
                      <div className="flex justify-between w-full mt-1 text-xs text-muted-foreground">
                        <span>Pouco diversificada</span>
                        <span>Ideal</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-gradient">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Retorno Esperado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center h-24">
                      <div className="text-2xl font-bold text-success flex items-center">
                        {insights.portfolio.expectedReturn}%
                        <ArrowUp className="h-5 w-5 ml-1" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Anual (projeção)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card className="card-gradient mb-8">
            <CardHeader className="pb-2">
              <CardTitle>Recomendações</CardTitle>
              <CardDescription>
                Insights personalizados para melhorar sua carteira
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.portfolio.recommendations.map(
                    (rec: Recommendation) => (
                      <Card
                        key={rec.id}
                        className={`bg-card/50 ${
                          rec.premium && !isPremium
                            ? 'relative overflow-hidden'
                            : ''
                        }`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{rec.title}</h3>
                            <Badge
                              variant={
                                rec.type === 'diversification'
                                  ? 'outline'
                                  : rec.type === 'risk'
                                  ? 'secondary'
                                  : 'default'
                              }>
                              {rec.type === 'diversification'
                                ? 'Diversificação'
                                : rec.type === 'risk'
                                ? 'Risco'
                                : 'Otimização'}
                            </Badge>
                          </div>
                          <p
                            className={`text-sm text-muted-foreground ${
                              rec.premium && !isPremium ? 'blur-sm' : ''
                            }`}>
                            {rec.description}
                          </p>

                          {rec.premium && !isPremium && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-background/90">
                              <div className="flex flex-col items-center">
                                <Lock className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                  Recurso Premium
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle>Otimização de Carteira</CardTitle>
              <CardDescription>
                Sugestões para balancear e otimizar seus investimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isPremium ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Recurso exclusivo Premium
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Faça upgrade para ver recomendações detalhadas de
                    balanceamento e otimização da sua carteira baseadas na sua
                    tolerância a risco.
                  </p>
                  <Button
                    variant="default"
                    onClick={() =>
                      toast({
                        title: 'Aguarde',
                        description: 'Recursos de assinatura em breve!',
                      })
                    }>
                    Desbloquear Recurso
                  </Button>
                </div>
              ) : (
                <div className="p-4">
                  <p>Conteúdo premium de otimização</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <Card className="card-gradient mb-8">
            <CardHeader className="pb-2">
              <CardTitle>Análise de Ativos</CardTitle>
              <CardDescription>
                Avaliação e recomendações para seus investimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.assets.map((asset: Asset) => (
                    <Card
                      key={asset.id}
                      className={`bg-card/50 hover:bg-card/70 cursor-pointer transition-colors ${
                        asset.premium && !isPremium
                          ? 'relative overflow-hidden'
                          : ''
                      }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center mb-1">
                              <h3 className="font-semibold">{asset.symbol}</h3>
                              <span className="text-sm text-muted-foreground ml-2">
                                {asset.name}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm">
                                Preço atual:{' '}
                                <span className="font-medium">
                                  {formatCurrency(asset.currentPrice)}
                                </span>
                              </span>
                              <BadgeInfo className="h-4 w-4 text-muted-foreground ml-2 cursor-help" />
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                recommendationColors[asset.recommendation]
                              }
                              className="capitalize">
                              {asset.recommendation}
                            </Badge>
                            <div
                              className={`text-sm mt-1 ${
                                asset.premium && !isPremium ? 'blur-sm' : ''
                              }`}>
                              Preço alvo:{' '}
                              <span className="font-medium">
                                {formatCurrency(asset.targetPrice)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`mt-3 ${
                            asset.premium && !isPremium ? 'blur-sm' : ''
                          }`}>
                          <div className="flex justify-between mb-1 text-sm">
                            <span>Força da recomendação</span>
                            <span>{asset.strength}%</span>
                          </div>
                          <Progress value={asset.strength} className="h-2" />
                        </div>

                        {asset.premium && !isPremium && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-background/90">
                            <div className="flex flex-col items-center">
                              <Lock className="h-5 w-5 mb-1" />
                              <span className="text-sm font-medium">
                                Recurso Premium
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle>Análise Técnica Detalhada</CardTitle>
              <CardDescription>
                Análise avançada e previsões para seus ativos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isPremium ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Recurso exclusivo Premium
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Faça upgrade para ver análises técnicas detalhadas,
                    suportes, resistências, e previsões de curto e longo prazo
                    para seus ativos.
                  </p>
                  <Button
                    variant="default"
                    onClick={() =>
                      toast({
                        title: 'Aguarde',
                        description: 'Recursos de assinatura em breve!',
                      })
                    }>
                    Desbloquear Recurso
                  </Button>
                </div>
              ) : (
                <div className="p-4">
                  <p>Conteúdo premium de análise técnica</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Tab */}
        <TabsContent value="market">
          <Card className="card-gradient mb-8">
            <CardHeader className="pb-2">
              <CardTitle>Visão de Mercado</CardTitle>
              <CardDescription>
                Análise geral de mercado e tendências
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-40" />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-medium">Sentimento de Mercado</h3>
                      <p className="text-sm text-muted-foreground">
                        Análise de curto prazo
                      </p>
                    </div>
                    <Badge
                      variant={
                        insights.market.sentiment === 'positivo'
                          ? 'default'
                          : insights.market.sentiment === 'negativo'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="px-4 py-1 capitalize">
                      {insights.market.sentiment}
                    </Badge>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-medium mb-3">Setores em Tendência</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.market.trendingSectors.map(
                        (sector: TrendingSector, index: number) => (
                          <div
                            key={index}
                            className={`p-3 bg-card/50 rounded-lg flex justify-between items-center ${
                              sector.premium && !isPremium
                                ? 'relative overflow-hidden'
                                : ''
                            }`}>
                            <span
                              className={
                                sector.premium && !isPremium ? 'blur-sm' : ''
                              }>
                              {sector.name}
                            </span>
                            <Badge
                              variant={
                                sector.trend === 'positivo'
                                  ? 'default'
                                  : sector.trend === 'negativo'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="capitalize">
                              {sector.trend}
                            </Badge>

                            {sector.premium && !isPremium && (
                              <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                                <Lock className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">
                      Oportunidades Identificadas
                    </h3>
                    <div className="space-y-4">
                      {insights.market.opportunities.map((opp: Opportunity) => (
                        <Card
                          key={opp.id}
                          className={`bg-card/50 ${
                            opp.premium && !isPremium
                              ? 'relative overflow-hidden'
                              : ''
                          }`}>
                          <CardContent className="p-4">
                            <h4 className="font-medium mb-1">{opp.title}</h4>
                            <p
                              className={`text-sm text-muted-foreground ${
                                opp.premium && !isPremium ? 'blur-sm' : ''
                              }`}>
                              {opp.description}
                            </p>

                            {opp.premium && !isPremium && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-background/90">
                                <div className="flex flex-col items-center">
                                  <Lock className="h-5 w-5 mb-1" />
                                  <span className="text-sm font-medium">
                                    Recurso Premium
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader className="pb-2">
              <CardTitle>Análise Macroeconômica</CardTitle>
              <CardDescription>
                Relatórios detalhados sobre fatores macroeconômicos e seu
                impacto nos mercados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isPremium ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Lock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Recurso exclusivo Premium
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Faça upgrade para acessar análises detalhadas sobre fatores
                    macroeconômicos, mudanças regulatórias e eventos globais que
                    afetam os mercados.
                  </p>
                  <Button
                    variant="default"
                    onClick={() =>
                      toast({
                        title: 'Aguarde',
                        description: 'Recursos de assinatura em breve!',
                      })
                    }>
                    Desbloquear Recurso
                  </Button>
                </div>
              ) : (
                <div className="p-4">
                  <p>Conteúdo premium de macroeconomia</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIInsights;
