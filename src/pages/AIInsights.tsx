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
import {
  ArrowDown,
  ArrowUp,
  BadgeInfo,
  Check,
  Lock,
  RefreshCw,
  Star,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {Skeleton} from '@/components/ui/skeleton';
import {Progress} from '@/components/ui/progress';
import aiAnalysisService, {
  AiAnalysisResult,
  StockScore,
  FiiScore,
  Forecast,
} from '@/services/ai';
import portfolioService from '@/services/portfolio';
import useAppToast from '@/hooks/use-app-toast';
import {jwtDecode} from 'jwt-decode';
import {subscriptionService} from '@/server/api/api';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'}).format(
    value,
  );

const recommendationBadge: Record<
  string,
  'default' | 'secondary' | 'destructive'
> = {
  COMPRA: 'default',
  HOLD: 'secondary',
  VENDA: 'destructive',
};

const AIInsights = () => {
  const toast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(
    null,
  );
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica plano do usuário
  useEffect(() => {
    const checkPlan = async () => {
      try {
        const res = await subscriptionService.getCurrentPlan();
        const planName: string = res.data?.planName || res.data?.name || '';
        setIsPremium(
          planName.toLowerCase().includes('premium') ||
            planName.toLowerCase().includes('pro'),
        );
      } catch {
        setIsPremium(false);
      }
    };
    checkPlan();
  }, []);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      // Busca portfólios do usuário
      const portfolios = await portfolioService.getPortfolios();
      if (!portfolios || portfolios.length === 0) {
        setError('Nenhum portfólio encontrado. Crie um portfólio primeiro.');
        return;
      }

      const firstPortfolio = portfolios[0];
      const fullPortfolio = await portfolioService.getPortfolio(
        firstPortfolio.id || firstPortfolio._id,
      );

      const token = localStorage.getItem('access_token');
      const plan = isPremium ? 'premium' : 'free';

      const payload = {
        profile_plan: plan,
        risk_profile: 'moderate',
        portfolio: {
          id: fullPortfolio.id || fullPortfolio._id,
          name: fullPortfolio.name,
          cpf: fullPortfolio.cpf || '',
          assets: (fullPortfolio.assets || []).map((asset: any) => ({
            symbol: asset.symbol,
            type: asset.type || 'stock',
            quantity: asset.amount || asset.quantity || 0,
            price: asset.purchasePrice || asset.price || 0,
            current_price: asset.price || 0,
            change_24h: asset.change24h || 0,
            metrics: asset.metrics || undefined,
          })),
          total_value: (fullPortfolio.assets || []).reduce(
            (sum: number, a: any) => sum + (a.value || 0),
            0,
          ),
          plan: plan,
        },
        address: {city: 'Brasil', state: 'BR', country: 'Brazil'},
        preferences: {language: 'pt-BR', theme: 'dark'},
      };

      const result = await aiAnalysisService.analyze(payload as any);
      setAnalysisResult(result);
      toast.success(
        'Análise concluída!',
        'Insights de IA carregados com sucesso.',
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Falha ao obter análise de IA';
      setError(msg);
      toast.error('Erro na análise', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [isPremium]);

  const stockEntries = analysisResult
    ? Object.entries(analysisResult.stock_scores || {})
    : [];
  const fiiEntries = analysisResult
    ? Object.entries(analysisResult.fii_scores || {})
    : [];
  const forecastEntries = analysisResult
    ? Object.entries(analysisResult.forecasts || {})
    : [];

  const claudeAnalysis = analysisResult?.claude_analysis;

  return (
    <div className="container py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Análise de IA</h1>
          <p className="text-muted-foreground mt-1">
            Insights inteligentes gerados pelo Trakker IA
          </p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalysis}
            disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            {loading ? 'Analisando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Upgrade Banner */}
      {!isPremium && (
        <Card className="mb-8 bg-gradient-to-r from-primary/90 to-blue-600/90 text-white border-none overflow-hidden relative">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="col-span-2">
                <h2 className="text-xl font-bold mb-2 flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Desbloqueie o poder da análise de IA
                </h2>
                <p className="mb-4">
                  Com o plano Premium você tem análise completa com IA (Claude),
                  previsões técnicas e insights personalizados.
                </p>
                <div className="flex items-center space-x-4">
                  <Check className="h-5 w-5" />
                  <span>Análise com IA (Claude + Prophet)</span>
                </div>
                <div className="flex items-center space-x-4 mt-1">
                  <Check className="h-5 w-5" />
                  <span>Previsões de preço 30 dias</span>
                </div>
                <div className="flex items-center space-x-4 mt-1 mb-4">
                  <Check className="h-5 w-5" />
                  <span>Realocação de carteira automática</span>
                </div>
              </div>
              <div className="flex justify-center md:justify-end">
                <Button
                  variant="secondary"
                  size="lg"
                  className="font-medium"
                  onClick={() =>
                    toast.info(
                      'Upgrade em breve!',
                      'Recursos de assinatura serão liberados em breve.',
                    )
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

      {/* Erro */}
      {error && !loading && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <BadgeInfo className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalysis}
              className="ml-auto">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stocks" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="stocks">
            Ações ({stockEntries.length})
          </TabsTrigger>
          <TabsTrigger value="fiis">FIIs ({fiiEntries.length})</TabsTrigger>
          {isPremium && forecastEntries.length > 0 && (
            <TabsTrigger value="forecasts">
              Previsões ({forecastEntries.length})
            </TabsTrigger>
          )}
          {isPremium && claudeAnalysis && (
            <TabsTrigger value="claude">Análise IA</TabsTrigger>
          )}
        </TabsList>

        {/* Tab Ações */}
        <TabsContent value="stocks">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Análise Fundamentalista — Ações</CardTitle>
              <CardDescription>
                Score baseado em ROE, CAGR, Dividendos, Governança e outros
                critérios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-28" />
                  ))}
                </div>
              ) : stockEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BadgeInfo className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Nenhuma ação no portfólio para analisar.</p>
                  <p className="text-sm mt-1">
                    Adicione ações ao seu portfólio para ver análises aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockEntries.map(([symbol, score]) => (
                    <AssetScoreCard
                      key={symbol}
                      symbol={symbol}
                      score={score}
                      isPremium={isPremium}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab FIIs */}
        <TabsContent value="fiis">
          <Card className="card-gradient">
            <CardHeader>
              <CardTitle>Análise Fundamentalista — FIIs</CardTitle>
              <CardDescription>
                Score baseado em P/VP, Dividend Yield, Histórico e Concentração
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-28" />
                  ))}
                </div>
              ) : fiiEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BadgeInfo className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>Nenhum FII no portfólio para analisar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fiiEntries.map(([symbol, score]) => (
                    <AssetScoreCard
                      key={symbol}
                      symbol={symbol}
                      score={score}
                      isPremium={isPremium}
                      isFii
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Previsões (Premium) */}
        {isPremium && forecastEntries.length > 0 && (
          <TabsContent value="forecasts">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle>Previsões Técnicas (30 dias)</CardTitle>
                <CardDescription>
                  Análise probabilística baseada no modelo Prophet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-24" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {forecastEntries.map(([symbol, forecast]) => (
                      <ForecastCard
                        key={symbol}
                        symbol={symbol}
                        forecast={forecast}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab Claude Analysis (Premium) */}
        {isPremium && claudeAnalysis && (
          <TabsContent value="claude">
            <ClaudeAnalysisPanel analysis={claudeAnalysis} />
          </TabsContent>
        )}
      </Tabs>

      {/* Mensagem free plan */}
      {analysisResult?.message && (
        <Card className="mt-6 bg-muted/40">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {analysisResult.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ---- Componentes Internos ---- */

interface AssetScoreCardProps {
  symbol: string;
  score: StockScore | FiiScore;
  isPremium: boolean;
  isFii?: boolean;
}

const AssetScoreCard = ({
  symbol,
  score,
  isPremium,
  isFii,
}: AssetScoreCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const scoreColor =
    score.score >= 70
      ? 'text-emerald-500'
      : score.score >= 50
        ? 'text-amber-500'
        : 'text-rose-500';

  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg">{symbol}</h3>
              {isFii && (score as FiiScore).critical_rejection && (
                <Badge variant="destructive" className="text-xs">
                  P/VP {'>'} 1.5
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{score.rating}</p>
          </div>
          <div className="text-right">
            <Badge
              variant={
                recommendationBadge[score.recommendation] || 'secondary'
              }>
              {score.recommendation}
            </Badge>
            <div className={`text-2xl font-bold mt-1 ${scoreColor}`}>
              {score.score.toFixed(0)}/100
            </div>
          </div>
        </div>

        <Progress value={score.score} className="h-2 mb-3" />

        {/* Detalhes — mostrar apenas para premium ou os primeiros 3 */}
        <div className="space-y-1">
          {(isPremium ? score.details : score.details.slice(0, 3)).map(
            (detail, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {detail}
              </p>
            ),
          )}
          {!isPremium && score.details.length > 3 && (
            <div className="relative mt-2 p-2 bg-muted/30 rounded flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                +{score.details.length - 3} critérios disponíveis no plano
                Premium
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface ForecastCardProps {
  symbol: string;
  forecast: Forecast;
}

const ForecastCard = ({symbol, forecast}: ForecastCardProps) => {
  const diff = forecast.forecast_30d - forecast.current;
  const pct = ((diff / forecast.current) * 100).toFixed(2);
  const isUp = forecast.trend === 'up';

  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">{symbol}</h3>
            <p className="text-sm text-muted-foreground">
              Atual: {formatCurrency(forecast.current)}
            </p>
          </div>
          <div className="text-right">
            <div
              className={`flex items-center gap-1 font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isUp ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {formatCurrency(forecast.forecast_30d)}
            </div>
            <p
              className={`text-sm ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isUp ? '+' : ''}
              {pct}% em 30 dias
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(forecast.confidence_lower)} –{' '}
              {formatCurrency(forecast.confidence_upper)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ClaudeAnalysisPanelProps {
  analysis: any;
}

const ClaudeAnalysisPanel = ({analysis}: ClaudeAnalysisPanelProps) => {
  const parsed =
    typeof analysis === 'string'
      ? (() => {
          try {
            return JSON.parse(analysis);
          } catch {
            return null;
          }
        })()
      : analysis;

  if (!parsed) {
    return (
      <Card className="card-gradient">
        <CardContent className="p-6">
          <pre className="whitespace-pre-wrap text-sm">{String(analysis)}</pre>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {parsed.portfolio_assessment && (
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Avaliação Geral da Carteira</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {parsed.portfolio_assessment}
            </p>
          </CardContent>
        </Card>
      )}

      {parsed.key_insights && parsed.key_insights.length > 0 && (
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Principais Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parsed.key_insights.map((insight: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-card/50 rounded-lg">
                  <Badge
                    variant={
                      insight.priority === 'high'
                        ? 'destructive'
                        : insight.priority === 'medium'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="mt-0.5 shrink-0">
                    {insight.priority}
                  </Badge>
                  <div>
                    <span className="font-medium">{insight.symbol}: </span>
                    <span className="text-sm text-muted-foreground">
                      {insight.insight}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {parsed.recommendations && parsed.recommendations.length > 0 && (
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parsed.recommendations.map((rec: any, i: number) => (
                <div key={i} className="p-3 bg-card/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        rec.action === 'SELL'
                          ? 'destructive'
                          : rec.action === 'BUY'
                            ? 'default'
                            : 'secondary'
                      }>
                      {rec.action}
                    </Badge>
                    <span className="font-medium">{rec.symbol}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {rec.urgency}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rec.rationale}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {parsed.risk_assessment && (
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle>Avaliação de Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{parsed.risk_assessment}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIInsights;
