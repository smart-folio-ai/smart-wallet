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
import {Progress} from '@/components/ui/progress';
import {Slider} from '@/components/ui/slider';
import {toast} from 'sonner';
import {aiAnalysisService, AiAnalysisResult} from '@/services/ai';
import {portfolioService} from '@/server/api/api';
import {formatCurrency, formatPercentage} from '@/utils/formatters';
import {cn} from '@/lib/utils';

const AIInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Estados para Simulação
  const [monthlyInvest, setMonthlyInvest] = useState(1000);
  const [years, setYears] = useState(10);
  const [totalValue, setTotalValue] = useState(0);
  const [simulation, setSimulation] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
      const tValue = assets.reduce((sum: number, a: any) => sum + (a.value || a.current_price * a.quantity || 0), 0);
      setTotalValue(tValue);

      const payload = {
        user_id: 'user_123',
        profile_plan: plan,
        portfolio: {
          id: 'default',
          name: 'Principal',
          cpf: '',
          assets: assets.map((a: any) => ({
            symbol: a.symbol || a.ticker || '',
            type: a.type || 'stock',
            quantity: a.quantity || 0,
            price: a.average_price || a.price || 0,
            current_price: a.current_price || a.price || 0,
            change_24h: a.change_24h || a.changePercent || 0,
            metrics: a.metrics || {},
          })),
          total_value: tValue,
          plan: plan,
        },
        risk_profile: 'moderate',
        address: {},
        preferences: {},
      };

      const result = await aiAnalysisService.analyze(payload as any);
      setAnalysisResult(result);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        'Falha ao obter análise de IA';
      setError(msg);
      toast.error('Erro na análise', { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    setSimLoading(true);
    try {
      const currentVal =
        totalValue || (analysisResult as any)?.ai_analysis?.investment_score
          ? (analysisResult?.ai_analysis as any).total_value
          : 10000;

      const res = await aiAnalysisService.simulate({
        monthly_investment: monthlyInvest,
        years,
        current_portfolio_value: currentVal || 10000,
        expected_annual_return: 0.1,
      });
      setSimulation(res);
    } catch (err) {
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
          Trakker IA está analisando seu patrimônio...
        </p>
      </div>
    );

  const aiData = analysisResult?.ai_analysis || analysisResult;
  const score = aiData?.investment_score;
  const isPremium = localStorage.getItem('user_plan') !== 'free';

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

  return (
    <div className="container mx-auto py-8 space-y-10 selection:bg-primary/20">
      {/* Header com Smart Feed */}
      <header className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Insights IA
            </h1>
            <p className="text-muted-foreground font-medium">
              Visão estratégica e proibições de erro com inteligência
              artificial.
            </p>
          </div>
          {!isPremium && <BadgePremium />}
        </div>

        {/* Smart Feed (Spotify Style) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(aiData?.smart_feed || []).length > 0 ? (
            aiData?.smart_feed?.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-3xl bg-card border border-primary/5 hover:border-primary/20 transition-all group cursor-pointer overflow-hidden relative">
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
            <div className="md:col-span-3 p-4 rounded-3xl bg-card/50 border border-dashed border-primary/20 text-center text-sm text-muted-foreground">
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
            <Card className="rounded-[2.5rem] bg-gradient-to-br from-card to-card/50 border-primary/5 shadow-2xl shadow-primary/5">
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
                        552.92 * (1 - (score?.overall || 0) / 100)
                      }
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black tracking-tighter">
                      {score?.overall || '--'}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Investment Score
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">
                    {score?.overall
                      ? score.overall > 80
                        ? 'Excelente'
                        : 'Bom'
                      : 'Calculando...'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sua pontuação baseada em fundamentos reais.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Text */}
            <Card className="rounded-[2.5rem] bg-card border-none shadow-none flex flex-col justify-center">
              <CardContent className="p-0">
                <div className="p-6 bg-primary/5 rounded-3xl mb-4 border border-primary/10">
                  <h4 className="flex items-center gap-2 text-sm font-bold mb-3">
                    <Activity className="h-4 w-4 text-primary" /> Opinião
                    Trakker
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    "
                    {aiData?.portfolio_assessment ||
                      'Analisando seu portfólio para gerar recomendações personalizadas...'}
                    "
                  </p>
                </div>
                {score && (
                  <div className="grid grid-cols-2 gap-4 px-2">
                    <ScoreRow
                      label="Diversificação"
                      val={score.diversification}
                    />
                    <ScoreRow label="Consistência" val={score.consistency} />
                    <ScoreRow label="Risco" val={score.risk} />
                    <ScoreRow label="Volatilidade" val={score.volatility} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Auto Rebalancing & Allocation */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-primary" /> Auto Rebalanceamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-primary/5 bg-card/40">
                <CardContent className="p-6 space-y-4">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase">
                    Proposta de Alocação Ideal
                  </h4>
                  <div className="space-y-4">
                    {(aiData?.rebalancing?.ideal_allocation || []).map((item, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{item.category}</span>
                          <div className="space-x-2">
                            <span className="text-muted-foreground line-through decoration-primary/30">
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
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
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
                </div>
              </div>
            </div>
          </section>

          {/* Radar Anti-Erro */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" /> Radar Anti-Erro
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(aiData?.error_detection || []).map((err, i) => (
                <div
                  key={i}
                  className={cn(
                    'p-5 rounded-3xl border transition-all',
                    err.severity === 'high'
                      ? 'bg-rose-500/5 border-rose-500/20 shadow-lg shadow-rose-500/5'
                      : 'bg-amber-500/5 border-amber-500/20',
                  )}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        err.severity === 'high'
                          ? 'bg-rose-500'
                          : 'bg-amber-500',
                      )}
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {err.type}
                    </span>
                    {err.symbol && (
                      <span className="ml-auto text-[10px] font-bold bg-muted px-2 py-0.5 rounded">
                        {err.symbol}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium leading-relaxed">
                    {err.message}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Future Simulation UI */}
          <Card className="rounded-[2.5rem] bg-card border-primary/5 overflow-hidden">
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
                      onValueChange={(v) => setMonthlyInvest(v[0])}
                      max={10000}
                      step={100}
                      className="py-4"
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <label className="font-bold">Prazo (Anos)</label>
                      <span className="font-bold font-mono text-primary">
                        {years} anos
                      </span>
                    </div>
                    <Slider
                      value={[years]}
                      onValueChange={(v) => setYears(v[0])}
                      max={35}
                      step={1}
                      className="py-4"
                    />
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

                <div className="bg-primary/5 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center border border-primary/10 relative">
                  {simulation ? (
                    <div className="animate-in fade-in zoom-in duration-500 space-y-6">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-3">
                          Patrimônio Esperado
                        </p>
                        <h2 className="text-5xl font-black text-primary tracking-tighter">
                          {formatCurrency(simulation.scenarios.neutral)}
                        </h2>
                      </div>
                      <div className="grid grid-cols-2 gap-8 pt-6 border-t border-primary/10">
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">
                            Pessimista
                          </span>
                          <span className="font-black text-rose-500 text-lg">
                            {formatCurrency(simulation.scenarios.pessimistic)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">
                            Otimista
                          </span>
                          <span className="font-black text-emerald-500 text-lg">
                            {formatCurrency(simulation.scenarios.optimistic)}
                          </span>
                        </div>
                      </div>
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
                  className="group p-5 rounded-3xl bg-card border border-primary/5 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:shadow-primary/5">
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
                      <ArrowRight className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {!isPremium && <UpgradeBanner />}
        </div>
      </div>
    </div>
  );
};

const ScoreRow = ({label, val}: {label: string; val: number}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
      <span>{label}</span>
      <span className="text-primary">{val}%</span>
    </div>
    <Progress
      value={val}
      className="h-1 bg-primary/5"
      indicatorClassName="bg-gradient-to-r from-primary/50 to-primary"
    />
  </div>
);

const BadgePremium = () => (
  <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-[10px] font-black text-black px-3 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1 shadow-lg shadow-amber-500/20 select-none cursor-default">
    <Zap className="h-3 w-3 fill-black" /> Pro Account
  </div>
);

const UpgradeBanner = () => (
  <Card className="rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-none relative overflow-hidden shadow-2xl shadow-indigo-500/20">
    <CardContent className="p-8 space-y-6 relative z-10">
      <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
        <Zap className="h-6 w-6 fill-white" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold">Libere o Trakker Pro</h3>
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
