import React, {useState, useEffect} from 'react';
import {
  Zap,
  Target,
  ShieldAlert,
  TrendingUp,
  RefreshCw,
  ArrowUp,
  ArrowRight,
  TrendingDown,
  Activity,
  Shuffle,
  Info,
  ChevronRight,
  Sparkles,
  PieChart,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {AiGeneratedNotice} from '@/components/ui/ai-generated-notice';
import {Progress} from '@/components/ui/progress';
import {Slider} from '@/components/ui/slider';
import {toast} from 'sonner';
import {
  aiAnalysisService,
  AiAnalysisResult,
  PortfolioScoreResponse,
  PortfolioErrorRadarResponse,
  PortfolioErrorRadarAlertType,
  FutureSimulatorHorizon,
  FutureSimulatorResponse,
} from '@/services/ai';
import {portfolioService, stockServices} from '@/server/api/api';
import {accumulateCdi} from '@/pages/cdi-performance.utils';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {resolveScoreTone, SCORE_TONE_CLASSES} from '@/utils/score-tone';
import type {ScoreTone} from '@/utils/score-tone';
import {cn} from '@/lib/utils';
import {useSubscription} from '@/hooks/useSubscription';
import {RagAskPanel} from '@/components/ai/RagAskPanel';
import {
  getAiPlanFromPlanName,
  getOrCreateAiAnalysis,
  isProOrHigherPlan,
} from '@/services/ai/trakkerAi';

const ERROR_RADAR_TYPE_LABEL: Record<PortfolioErrorRadarAlertType, string> = {
  concentration: 'Concentração',
  diversification: 'Diversificação',
  volatility: 'Volatilidade',
  other: 'Risco',
};

// POST /ai/future-simulator só aceita estes quatro horizontes — não é um
// range livre. Selecionável, não deslizante.
const HORIZON_OPTIONS: {value: FutureSimulatorHorizon; label: string}[] = [
  {value: '6m', label: '6 meses'},
  {value: '1y', label: '1 ano'},
  {value: '5y', label: '5 anos'},
  {value: '10y', label: '10 anos'},
];

const AIInsights: React.FC = () => {
  const {planName, isSubscribed, isLoading: subLoading} = useSubscription();
  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [portfolioScore, setPortfolioScore] =
    useState<PortfolioScoreResponse | null>(null);
  const [errorRadar, setErrorRadar] =
    useState<PortfolioErrorRadarResponse | null>(null);

  // Estados para Simulação
  const [monthlyInvest, setMonthlyInvest] = useState(1000);
  const [horizon, setHorizon] = useState<FutureSimulatorHorizon>('10y');
  const [simulation, setSimulation] = useState<FutureSimulatorResponse | null>(
    null,
  );
  const [simLoading, setSimLoading] = useState(false);
  const [cdiComparison, setCdiComparison] = useState<number | null>(null);

  // Estado mínimo de viewMode: a Task 8 (badge/toggle de perfil de
  // investidor) ainda não foi implementada — depende de um endpoint de
  // backend que ainda não foi mergeado. Esta é apenas a leitura/persistência
  // via localStorage necessária para features que já precisam reagir ao
  // modo (como a comparação com CDI abaixo). A Task 8 deve reutilizar este
  // estado e este efeito, não redeclará-los.
  const [viewMode, setViewMode] = useState<'standard' | 'advanced'>(
    'standard',
  );

  useEffect(() => {
    const savedMode = localStorage.getItem('ai_insights_view_mode');
    if (savedMode === 'standard' || savedMode === 'advanced') {
      setViewMode(savedMode);
    }
  }, []);

  const hasProOrHigher = isProOrHigherPlan(planName, isSubscribed);
  const aiPlan = getAiPlanFromPlanName(planName);

  useEffect(() => {
    if (subLoading) return;
    fetchData();
  }, [subLoading, hasProOrHigher, aiPlan]);

  const fetchData = async () => {
    if (!hasProOrHigher) {
      setAnalysisResult(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const portfolioResponse = await portfolioService.getAssets();
      // The API can return the array directly OR wrapped in { assets: [...] }
      const rawData = portfolioResponse.data;
      const assets: any[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.assets)
          ? rawData.assets
          : [];

      // Usa 'premium' por padrão para sempre acionar a análise com IA
      const plan = (localStorage.getItem('user_plan') as any) || 'premium';

      // Score de carteira e radar de erro vêm do backend determinístico e são
      // independentes entre si e da análise do LLM: se o trackerr-ia estiver
      // fora, os dois ainda aparecem, e vice-versa. Por isso allSettled em
      // vez de await sequencial.
      const [analysisOutcome, scoreOutcome, errorRadarOutcome] =
        await Promise.allSettled([
          getOrCreateAiAnalysis({rawAssets: assets, plan: aiPlan}),
          aiAnalysisService.portfolioScore(),
          aiAnalysisService.errorRadar(),
        ]);

      if (scoreOutcome.status === 'fulfilled') {
        setPortfolioScore(scoreOutcome.value);
      } else {
        setPortfolioScore(null);
      }

      if (errorRadarOutcome.status === 'fulfilled') {
        setErrorRadar(errorRadarOutcome.value);
      } else {
        setErrorRadar(null);
      }

      if (analysisOutcome.status === 'rejected') {
        throw analysisOutcome.reason;
      }
      setAnalysisResult(analysisOutcome.value);
    } catch {
      setError(
        'Não foi possível carregar os insights agora. Tente novamente em alguns instantes.',
      );
      toast.error('Não foi possível analisar sua carteira no momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    setSimLoading(true);
    try {
      // POST /ai/future-simulator busca a carteira do usuário autenticado
      // por conta própria — não recebe valor de carteira nem taxa de retorno
      // esperada como entrada (os cenários pessimista/base/otimista são
      // fixos no server e vêm de volta em `assumptions`, não configuráveis).
      const res = await aiAnalysisService.futureSimulator({
        horizon,
        monthlyContribution: monthlyInvest > 0 ? monthlyInvest : undefined,
      });
      setSimulation(res);

      if (viewMode === 'advanced') {
        const monthsBack = res.months;
        const from = new Date();
        from.setMonth(from.getMonth() - monthsBack);
        const to = new Date();
        try {
          const cdiResponse = await stockServices.getCdiSeries(
            from.toISOString().slice(0, 10),
            to.toISOString().slice(0, 10),
          );
          const series = cdiResponse.data?.series;
          if (Array.isArray(series) && series.length > 1) {
            const accumulated = accumulateCdi(series);
            const lastValue = Array.from(accumulated.values()).pop();
            if (typeof lastValue === 'number') {
              setCdiComparison(
                res.currentPortfolioValue * (1 + lastValue / 100),
              );
            } else {
              setCdiComparison(null);
            }
          } else {
            setCdiComparison(null);
          }
        } catch {
          setCdiComparison(null);
        }
      } else {
        setCdiComparison(null);
      }
    } catch (err) {
      setSimulation(null);
      setCdiComparison(null);
      toast.error('Não foi possível calcular a projeção.');
    } finally {
      setSimLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">
          Trackerr IA está analisando seu patrimônio...
        </p>
      </div>
    );

  const aiData = analysisResult?.ai_analysis || analysisResult;
  const isPremium = hasProOrHigher;

  // Score determinístico (GET /ai/portfolio-score). `overall` é null quando a
  // carteira não tem posição suficiente — nunca 0, que seria lido como
  // "carteira péssima" em vez de "sem dado".
  const hasScore =
    portfolioScore?.status === 'ok' && portfolioScore.overall !== null;
  const overallScore = hasScore ? portfolioScore!.overall! : null;
  const dimensionScore = (key: 'diversification' | 'risk'): number | null => {
    const dimension = portfolioScore?.dimensions?.find(
      (item) => item.key === key,
    );
    return typeof dimension?.score === 'number' ? dimension.score : null;
  };

  const scoreTone = resolveScoreTone(overallScore);
  const scoreToneClasses = SCORE_TONE_CLASSES[scoreTone];

  const simulationTone = simulation
    ? resolveScoreTone(
        simulation.scenarios.base.projectedValue >
          simulation.currentPortfolioValue * 1.5
          ? 80
          : 50,
      )
    : 'neutral';

  if (error && !analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Ops! Algo deu errado.</h2>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={fetchData} variant="outline" className="rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  const SEVERITY_ORDER: Record<'high' | 'medium' | 'low', number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  const SEVERITY_LABEL: Record<'high' | 'medium' | 'low', string> = {
    high: 'ALTO',
    medium: 'MÉDIO',
    low: 'BAIXO',
  };

  const sortedAlerts = [...(errorRadar?.alerts || [])].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
  const highCount = sortedAlerts.filter((a) => a.severity === 'high').length;
  const mediumCount = sortedAlerts.filter((a) => a.severity === 'medium').length;

  return (
    <div className="container mx-auto py-8 space-y-10 selection:bg-primary/20">
      {/* Header com Smart Feed */}
      <header className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight font-heading text-foreground">
                Insights IA
              </h1>
              <button
                type="button"
                aria-label="Atualizar análise"
                onClick={fetchData}
                className="h-8 w-8 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted/10 transition-colors">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-muted-foreground font-medium">
              Visão estratégica e prevenção de erros com inteligência
              artificial.
            </p>
          </div>
          {isPremium && <BadgePremium />}
        </div>

        {/* Smart Feed (Spotify Style) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(aiData?.smart_feed || []).length > 0 ? (
            aiData?.smart_feed?.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-primary/5 hover:border-primary/20 transition-all group cursor-pointer overflow-hidden relative">
                <div
                  className={cn(
                    'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0',
                    item.impact === 'positive'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500',
                  )}>
                  {item.impact === 'positive' ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : (
                    <TrendingDown className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{item.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.content}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
              </div>
            ))
          ) : (
            <div className="md:col-span-3 p-4 rounded-2xl bg-card/50 border border-dashed border-primary/20 text-center text-sm text-muted-foreground">
              Seu Feed Inteligente será gerado na próxima análise.
            </div>
          )}
        </section>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Score & Análise (8 colunas) */}
        <div className="xl:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Investment Score Gauge */}
            <Card className="rounded-2xl bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-lg">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative">
                  <svg className="h-48 w-48 -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted/10"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={552.92}
                      strokeDashoffset={
                        552.92 * (1 - (overallScore ?? 0) / 100)
                      }
                      className={cn(
                        scoreToneClasses.text,
                        'transition-all duration-1000 ease-out',
                      )}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black tracking-tighter">
                      {overallScore ?? '--'}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Score da carteira
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">
                    {overallScore === null
                      ? 'Sem dados suficientes'
                      : overallScore >= 80
                        ? 'Excelente'
                        : overallScore >= 60
                          ? 'Bom'
                          : overallScore >= 40
                            ? 'Regular'
                            : 'Frágil'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {overallScore === null
                      ? 'Adicione ativos à carteira para calcular o score.'
                      : 'Calculado a partir da diversificação e do risco da sua carteira.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Text */}
            <Card className="rounded-2xl bg-card border-none shadow-none flex flex-col justify-center">
              <CardContent className="p-0">
                <div className="p-6 bg-muted/5 rounded-2xl mb-4 border-l-2 border-border">
                  <h4 className="flex items-center gap-2 text-sm font-bold mb-3">
                    <Activity className="h-4 w-4 text-primary" /> Opinião
                    Trackerr
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    "
                    {aiData?.portfolio_assessment ||
                      'Analisando seu portfólio para gerar recomendações personalizadas...'}
                    "
                  </p>
                  {aiData?.portfolio_assessment && (
                    <AiGeneratedNotice className="pt-2" />
                  )}
                </div>
                {/* Só diversificação e risco: consistência e volatilidade não
                    têm cálculo determinístico e foram removidas em vez de
                    exibirem número inventado pelo LLM (TRA-5). */}
                {hasScore && (
                  <div className="grid grid-cols-2 gap-4 px-2">
                    <ScoreRow
                      label="Diversificação"
                      val={dimensionScore('diversification')}
                      tone={resolveScoreTone(dimensionScore('diversification'))}
                    />
                    {/* "Controle de risco", não "Risco": a dimensão vem
                        normalizada para maior = melhor, então uma barra cheia
                        sob o rótulo "Risco" leria como o oposto do que é. */}
                    <ScoreRow
                      label="Controle de risco"
                      val={dimensionScore('risk')}
                      tone={resolveScoreTone(dimensionScore('risk'))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pergunta contextual ao RAG sobre a carteira (TRA-39). */}
          <Card className="rounded-2xl bg-card border-primary/5">
            <CardContent className="p-6">
              <RagAskPanel
                contextLabel="sua carteira"
                placeholder="Pergunte sobre a sua carteira..."
                quickPrompts={[
                  'Por que minha carteira está concentrada?',
                  'Qual o maior risco da minha carteira hoje?',
                  'Como estão meus dividendos projetados?',
                ]}
              />
            </CardContent>
          </Card>

          {/* Auto Rebalancing & Allocation */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-primary" /> Auto Rebalanceamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl border-primary/5 bg-card/40">
                <CardContent className="p-6 space-y-4">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase">
                    Proposta de Alocação Ideal
                  </h4>
                  <div className="space-y-4">
                    {(aiData?.rebalancing?.ideal_allocation || []).map(
                      (item, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span>{item.category}</span>
                            <div className="space-x-2">
                              <span className="text-muted-foreground line-through decoration-muted-foreground/40">
                                {item.current.toFixed(1)}%
                              </span>
                              <span className="text-primary">
                                {item.ideal.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden flex">
                            <div
                              style={{width: `${item.current}%`}}
                              className="bg-muted-foreground/30 h-full"
                            />
                            <div
                              style={{
                                width: `${Math.max(0, item.ideal - item.current)}%`,
                              }}
                              className="bg-primary h-full opacity-50"
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <div className="bg-muted/5 rounded-2xl p-6 border border-border/60">
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" /> Movimentações
                    Sugeridas
                  </h4>
                  <div className="space-y-2">
                    {(aiData?.rebalancing?.top_moves || []).map((move, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-sm font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {move}
                      </div>
                    ))}
                  </div>
                  {(aiData?.rebalancing?.top_moves || []).length > 0 && (
                    <AiGeneratedNotice className="pt-3" />
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Radar Anti-Erro */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" /> Radar Anti-Erro
            </h2>
            {errorRadar === null && (
              <div className="p-5 rounded-2xl border border-border/60 bg-muted/5 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar o radar.
                </p>
                <Button onClick={fetchData} variant="outline" size="sm" className="rounded-xl">
                  Tentar novamente
                </Button>
              </div>
            )}
            {errorRadar?.status === 'ok' && sortedAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum alerta no momento — sinais de concentração, diversificação e
                risco dentro do esperado.
              </p>
            )}
            {sortedAlerts.length > 0 && (
              <p className="text-xs font-bold text-muted-foreground">
                {sortedAlerts.length} alertas — {highCount} alto(s), {mediumCount} médio(s)
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAlerts.map((alert) => (
                <div
                  key={alert.code}
                  className={cn(
                    'p-5 rounded-2xl border transition-all',
                    alert.severity === 'high'
                      ? 'bg-warning/5 border-warning/20'
                      : 'bg-muted/5 border-border/60',
                  )}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        'text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest',
                        alert.severity === 'high'
                          ? 'bg-warning text-warning-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}>
                      {SEVERITY_LABEL[alert.severity]}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {ERROR_RADAR_TYPE_LABEL[alert.type]}
                    </span>
                    {alert.symbol && (
                      <span className="ml-auto text-[10px] font-bold bg-muted px-2 py-0.5 rounded">
                        {alert.symbol}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{alert.message}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Future Simulation UI */}
          <Card className="rounded-2xl bg-card border-primary/5 overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-2xl font-black">
                Simulador de Futuro
              </CardTitle>
              <CardDescription>
                O que acontece se você investir regularmente?
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <label className="font-bold">Aporte Mensal</label>
                      <span className="font-bold font-mono text-primary">
                        {formatCurrency(monthlyInvest)}
                      </span>
                    </div>
                    <Slider
                      value={[monthlyInvest]}
                      onValueChange={(v) => {
                        setMonthlyInvest(v[0]);
                        setSimulation(null);
                        setCdiComparison(null);
                      }}
                      max={10000}
                      step={100}
                      className="py-4"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="font-bold text-sm">Horizonte</label>
                    <div className="grid grid-cols-4 gap-2">
                      {HORIZON_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setHorizon(option.value);
                            setSimulation(null);
                            setCdiComparison(null);
                          }}
                          className={cn(
                            'rounded-xl py-2 text-xs font-bold border transition-colors',
                            horizon === option.value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-primary/10 text-muted-foreground hover:bg-primary/5',
                          )}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full h-12 rounded-2xl font-bold text-lg"
                    onClick={handleSimulate}
                    disabled={simLoading}>
                    {simLoading ? (
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      'Calcular Projeção IA'
                    )}
                  </Button>
                </div>

                <div
                  className={cn(
                    'rounded-[2rem] p-8 flex flex-col justify-center items-center text-center border relative',
                    SCORE_TONE_CLASSES[simulationTone].bg,
                    SCORE_TONE_CLASSES[simulationTone].border,
                  )}>
                  {simulation ? (
                    <div className="animate-in fade-in zoom-in duration-500 space-y-6">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-3">
                          Patrimônio Esperado
                        </p>
                        <h2 className="text-5xl font-black text-primary tracking-tighter">
                          {formatCurrency(simulation.scenarios.base.projectedValue)}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-2">
                          Faixa estimada: {formatCurrency(simulation.scenarios.base.range.lower)}
                          {' – '}
                          {formatCurrency(simulation.scenarios.base.range.upper)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-8 pt-6 border-t border-primary/10">
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">
                            Pessimista
                          </span>
                          <span className="font-black text-rose-500 text-lg">
                            {formatCurrency(
                              simulation.scenarios.pessimistic.projectedValue,
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">
                            Otimista
                          </span>
                          <span className="font-black text-emerald-500 text-lg">
                            {formatCurrency(
                              simulation.scenarios.optimistic.projectedValue,
                            )}
                          </span>
                        </div>
                      </div>
                      {viewMode === 'advanced' && cdiComparison !== null && (
                        <div className="pt-4 border-t border-border/60 w-full">
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">
                            CDI no período
                          </span>
                          <span className="font-black text-foreground text-lg">
                            {formatCurrency(cdiComparison)}
                          </span>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            Estimativa simplificada: aplica o CDI acumulado do
                            período sobre o valor atual da carteira, sem
                            simular os aportes mensais dentro do CDI.
                          </p>
                        </div>
                      )}
                      {simulation.limitations.length > 0 && (
                        <p className="text-[10px] text-muted-foreground/70 pt-2">
                          Projeção com dados parciais da carteira.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <PieChart className="h-12 w-12 text-primary/20 mx-auto" />
                      <p className="text-sm text-muted-foreground max-w-[200px]">
                        Ajuste os aportes e simule o poder dos juros compostos.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito (4 colunas) */}
        <div className="xl:col-span-4 space-y-8">
          {/* Radar de Oportunidades */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Radar de Oportunidades
            </h2>
            <div className="space-y-3">
              {(aiData?.opportunity_radar || []).map((opp, i) => (
                <div
                  key={i}
                  className="group p-5 rounded-2xl bg-card border border-primary/5 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-primary/5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="block font-black text-xl group-hover:text-primary transition-colors">
                        {opp.symbol}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                        {opp.type}
                      </span>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-1 rounded-full flex items-center">
                      <ArrowUp className="h-3 w-3 mr-1" />{' '}
                      {opp.upside.toFixed(1)}% UPSIDE
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">
                    "{opp.rationale}"
                  </p>
                  <div className="flex justify-between items-center mt-5 pt-4 border-t border-primary/5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Alvo:{' '}
                      <span className="text-foreground">
                        {formatCurrency(opp.target_price)}
                      </span>
                    </span>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <ArrowRight className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(aiData?.opportunity_radar || []).length > 0 && (
              <AiGeneratedNotice className="pt-2" />
            )}
          </section>

          {!isPremium && <UpgradeBanner />}
        </div>
      </div>
    </div>
  );
};

const ScoreRow = ({
  label,
  val,
  tone = 'neutral',
}: {
  label: string;
  val: number | null;
  tone?: ScoreTone;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
      <span>{label}</span>
      {/* Em dash quando não há valor. `val || 0` mostraria 0% para dado
          ausente, que é uma afirmação — e errada. */}
      <span className={SCORE_TONE_CLASSES[tone].text}>
        {val === null ? '—' : `${val}%`}
      </span>
    </div>
    <Progress
      value={val ?? 0}
      className="h-1 bg-primary/5"
      indicatorClassName={cn(
        tone === 'warning' && 'bg-gradient-to-r from-warning/50 to-warning',
        tone === 'neutral' && 'bg-gradient-to-r from-muted-foreground/50 to-muted-foreground',
        tone === 'positive' && 'bg-gradient-to-r from-positive/50 to-positive',
      )}
    />
  </div>
);

const BadgePremium = () => (
  <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-[10px] font-black text-black px-3 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-lg shadow-amber-500/20 select-none cursor-default">
    <Zap className="h-3 w-3 fill-black" /> Pro Account
  </div>
);

const UpgradeBanner = () => (
  <Card className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none relative overflow-hidden shadow-2xl shadow-indigo-500/20">
    <CardContent className="p-8 space-y-6 relative z-10">
      <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
        <Zap className="h-6 w-6 fill-white" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold">Libere o Trackerr Pro</h3>
        <p className="text-sm text-indigo-100 leading-relaxed">
          Tenha rebalanceamento automático real-time, acesso a robôs de
          arbitragem e radar de oportunidades expandido.
        </p>
      </div>
      <Button
        variant="secondary"
        className="w-full rounded-2xl font-bold shadow-xl">
        Fazer Upgrade
      </Button>
    </CardContent>
    <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-3xl" />
  </Card>
);

export default AIInsights;
