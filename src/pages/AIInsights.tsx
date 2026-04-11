import React, {useEffect, useMemo, useState} from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  FlaskConical,
  Gauge,
  Globe,
  History,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'sonner';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {useSubscription} from '@/hooks/useSubscription';
import {fiscalService, portfolioService} from '@/server/api/api';
import {AiAnalysisResult} from '@/services/ai';
import {
  buildInsightsV2,
  buildPortfolioInsightSnapshot,
  buildScanExpandedPayloads,
  ExpandedInsightPayload,
  InsightCard,
  InsightsV2Output,
  PortfolioInsightSnapshot,
} from '@/services/ai/insights-v2';
import {CustomTooltip} from '@/components/ui/custom-tooltip';
import {
  getAiPlanFromPlanName,
  getOrCreateAiAnalysis,
  isProOrHigherPlan,
} from '@/services/ai/trakkerAi';
import {formatCurrency} from '@/utils/formatters';
import {cn} from '@/lib/utils';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const SNAPSHOT_STORAGE_KEY = 'trackerr_insights_v2_snapshot';

type ScanExpandedId =
  | 'scan_daily_impact'
  | 'scan_top_opportunity'
  | 'scan_top_risk'
  | 'scan_score_status'
  | 'scan_market_signal';

const AIInsights: React.FC = () => {
  const navigate = useNavigate();
  const {planName, isSubscribed, isLoading: subLoading} = useSubscription();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(
    null,
  );
  const [portfolioAssets, setPortfolioAssets] = useState<any[]>([]);
  const [fiscalSummary, setFiscalSummary] = useState<any | null>(null);
  const [fiscalOptimizer, setFiscalOptimizer] = useState<any | null>(null);
  const [previousSnapshot, setPreviousSnapshot] =
    useState<PortfolioInsightSnapshot | null>(null);
  const [expandedOpen, setExpandedOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasProOrHigher = isProOrHigherPlan(planName, isSubscribed);
  const aiPlan = getAiPlanFromPlanName(planName);

  useEffect(() => {
    if (subLoading) return;
    void fetchData();
  }, [subLoading, hasProOrHigher, aiPlan]);

  const fetchData = async () => {
    if (!hasProOrHigher) {
      setLoading(false);
      setAnalysisResult(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const portfolioResponse = await portfolioService.getAssets();
      const rawData = portfolioResponse.data;
      const assets: any[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.assets)
          ? rawData.assets
          : [];

      setPortfolioAssets(assets);

      const [summaryResult, optimizerResult] = await Promise.allSettled([
        fiscalService.getSummary(),
        fiscalService.getOptimizer(),
      ]);

      setFiscalSummary(
        summaryResult.status === 'fulfilled' ? summaryResult.value?.data || null : null,
      );
      setFiscalOptimizer(
        optimizerResult.status === 'fulfilled'
          ? optimizerResult.value?.data || null
          : null,
      );

      const analysis = await getOrCreateAiAnalysis({
        rawAssets: assets,
        plan: aiPlan,
      });
      setAnalysisResult(analysis);
      setPreviousSnapshot(readSnapshot());
    } catch {
      setError(
        'Não foi possível carregar os insights agora. Tente novamente em alguns instantes.',
      );
      toast.error('Não foi possível analisar sua carteira no momento.');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = useMemo(
    () =>
      (portfolioAssets || []).reduce(
        (sum: number, asset: any) =>
          sum +
          Number(asset?.current_price || asset?.price || 0) *
            Number(asset?.quantity || 0),
        0,
      ),
    [portfolioAssets],
  );

  const scanLayer = useMemo(() => {
    const aiData = analysisResult?.ai_analysis || analysisResult;
    const score = aiData?.investment_score?.overall;
    const scoreStatus =
      typeof score === 'number'
        ? score >= 80
          ? 'Forte'
          : score >= 60
            ? 'Saudável'
            : score >= 40
              ? 'Atenção'
              : 'Crítico'
        : 'Indisponível';

    const dailyImpact = (portfolioAssets || []).reduce((sum: number, asset: any) => {
      const price = Number(asset?.current_price || asset?.price || 0);
      const quantity = Number(asset?.quantity || 0);
      const change24h = Number(asset?.change_24h || asset?.change24h || 0);
      if (
        !Number.isFinite(price) ||
        !Number.isFinite(quantity) ||
        !Number.isFinite(change24h)
      ) {
        return sum;
      }
      return sum + price * quantity * (change24h / 100);
    }, 0);

    const bestOpportunity = ((aiData?.opportunity_radar || []) as any[])
      .slice()
      .sort((a, b) => Number(b?.upside || 0) - Number(a?.upside || 0))[0];

    const topRisk =
      String((aiData?.error_detection || [])[0]?.message || '').trim() ||
      (Number((aiData?.investment_score?.risk as number) || 0) >= 70
        ? 'Score de risco elevado requer revisão de concentração.'
        : 'Sem risco crítico identificado.');

    const assets = normalizeAssets(portfolioAssets);
    const total = assets.reduce((sum, item) => sum + item.value, 0);
    const internationalValue = assets
      .filter((asset) => isLikelyInternational(asset.symbol, asset.type))
      .reduce((sum, asset) => sum + asset.value, 0);
    const internationalPct = total > 0 ? (internationalValue / total) * 100 : null;

    return {
      dailyImpact,
      score,
      scoreStatus,
      bestOpportunity,
      topRisk,
      internationalPct,
    };
  }, [analysisResult, portfolioAssets]);

  const currentSnapshot = useMemo(() => {
    const aiData = analysisResult?.ai_analysis || analysisResult;
    const assets = normalizeAssets(portfolioAssets);
    const total = assets.reduce((sum, asset) => sum + asset.value, 0);

    const topAsset = assets.slice().sort((a, b) => b.value - a.value)[0];
    const topAssetConcentrationPct =
      topAsset && total > 0 ? Number(((topAsset.value / total) * 100).toFixed(2)) : null;

    const internationalValue = assets
      .filter((asset) => isLikelyInternational(asset.symbol, asset.type))
      .reduce((sum, asset) => sum + asset.value, 0);
    const internationalExposurePct =
      total > 0 ? Number(((internationalValue / total) * 100).toFixed(2)) : null;

    const incomeLikeValue = assets
      .filter((asset) => asset.type.includes('fii') || asset.type.includes('fixed'))
      .reduce((sum, asset) => sum + asset.value, 0);
    const incomePredictabilityScore =
      total > 0 ? Math.round((incomeLikeValue / total) * 100) : null;

    return buildPortfolioInsightSnapshot({
      diversificationScore:
        typeof aiData?.investment_score?.diversification === 'number'
          ? aiData.investment_score.diversification
          : null,
      riskScore:
        typeof aiData?.investment_score?.risk === 'number'
          ? aiData.investment_score.risk
          : null,
      topAssetConcentrationPct,
      internationalExposurePct,
      incomePredictabilityScore,
      now: new Date(),
    });
  }, [analysisResult, portfolioAssets]);

  useEffect(() => {
    if (!hasProOrHigher || !analysisResult) return;
    writeSnapshot(currentSnapshot);
  }, [currentSnapshot, hasProOrHigher, analysisResult]);

  const insights = useMemo<InsightsV2Output | null>(() => {
    if (!analysisResult) return null;
    return buildInsightsV2({
      assets: portfolioAssets,
      analysis: analysisResult,
      fiscalSummary,
      fiscalOptimizer,
      previousSnapshot,
      now: new Date(),
    });
  }, [analysisResult, fiscalOptimizer, fiscalSummary, portfolioAssets, previousSnapshot]);

  const scanExpandedById = useMemo(() => {
    if (!insights) return null;
    return buildScanExpandedPayloads({
      assets: portfolioAssets,
      analysis: analysisResult,
      insights,
      now: new Date(),
    });
  }, [analysisResult, insights, portfolioAssets]);

  const expandedPayload = useMemo<ExpandedInsightPayload | null>(() => {
    if (!expandedId || !insights) return null;
    if ((scanExpandedById as Record<string, ExpandedInsightPayload> | null)?.[expandedId]) {
      return (scanExpandedById as Record<string, ExpandedInsightPayload>)[expandedId];
    }
    return insights.expandedById[expandedId] || null;
  }, [expandedId, insights, scanExpandedById]);

  const opinionCard = useMemo(
    () => insights?.cards.find((item) => item.type === 'trackerr_opinion') || null,
    [insights],
  );

  const chartLayer = useMemo(() => {
    const assets = normalizeAssets(portfolioAssets);
    const total = assets.reduce((sum, asset) => sum + asset.value, 0);

    const byClass = assets.reduce((acc, asset) => {
      const key = resolveAssetClass(asset.type);
      acc.set(key, (acc.get(key) || 0) + asset.value);
      return acc;
    }, new Map<string, number>());

    const classLabel: Record<string, string> = {
      equities: 'Ações/ETFs',
      fiis: 'FIIs',
      crypto: 'Cripto',
      fixed_income: 'Renda Fixa',
      other: 'Outros',
    };

    const classColor: Record<string, string> = {
      equities: '#2563eb',
      fiis: '#10b981',
      crypto: '#f59e0b',
      fixed_income: '#8b5cf6',
      other: '#64748b',
    };

    const allocationByClass = Array.from(byClass.entries())
      .map(([key, value]) => ({
        key,
        label: classLabel[key] || key,
        value,
        pct: total > 0 ? Number(((value / total) * 100).toFixed(2)) : 0,
        color: classColor[key] || '#64748b',
      }))
      .sort((a, b) => b.value - a.value);

    const topExposures = assets
      .slice()
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((asset) => ({
        symbol: asset.symbol,
        value: asset.value,
        pct: total > 0 ? Number(((asset.value / total) * 100).toFixed(2)) : 0,
      }));

    const scoreRaw = Number(scanLayer.score);
    const riskRaw = Number(currentSnapshot.riskScore);
    const diversificationRaw = Number(currentSnapshot.diversificationScore);
    const score = Number.isFinite(scoreRaw) ? scoreRaw : null;
    const risk = Number.isFinite(riskRaw) ? riskRaw : null;
    const diversification = Number.isFinite(diversificationRaw)
      ? diversificationRaw
      : null;

    const scoreBars = [
      {label: 'Score Geral', value: score},
      {label: 'Diversificação', value: diversification},
      {label: 'Risco (invertido)', value: risk !== null ? 100 - risk : null},
    ];

    return {
      allocationByClass,
      topExposures,
      scoreBars,
      total,
    };
  }, [
    currentSnapshot.diversificationScore,
    currentSnapshot.riskScore,
    portfolioAssets,
    scanLayer.score,
  ]);

  const openExpanded = (id: string) => {
    setExpandedId(id);
    setExpandedOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">
          Preparando sua camada de decisão...
        </p>
      </div>
    );
  }

  if (!hasProOrHigher) {
    return (
      <div className="container mx-auto py-8">
        <Card className="rounded-2xl border-amber-200 bg-amber-50">
          <CardContent className="p-6 space-y-3">
            <h2 className="text-xl font-bold text-amber-900">
              Insights V2 disponível para planos PRO/PREMIUM
            </h2>
            <p className="text-sm text-amber-800">
              Esta tela foi evoluída para priorização acionável, custo de inação e riscos ocultos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !insights) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Ops! Algo deu errado.</h2>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <Button onClick={fetchData} variant="outline" className="rounded-xl">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <>
      <div className="container mx-auto py-8 space-y-6" data-testid="insights-v2-page">
        <header className="space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Insights V2</h1>
              <p className="text-muted-foreground text-sm">
                Resumão do que está pegando na carteira e onde vale agir primeiro.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Patrimônio analisado</p>
              <p className="font-semibold">{formatCurrency(totalValue || 0)}</p>
            </div>
          </div>
        </header>

        <section className="space-y-3" data-testid="insights-scan-layer">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Resumo Rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <MiniScanCard
              id="scan_daily_impact"
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="Impacto Diário"
              value={formatCurrency(scanLayer.dailyImpact || 0)}
              subtitle="quanto mexeu hoje na prática"
              tone={scanLayer.dailyImpact < 0 ? 'warning' : 'default'}
              onOpen={openExpanded}
            />
            <MiniScanCard
              id="scan_top_opportunity"
              icon={<Target className="h-4 w-4 text-emerald-600" />}
              label="Top Oportunidade"
              value={
                scanLayer.bestOpportunity
                  ? `${String(scanLayer.bestOpportunity.symbol || '').toUpperCase()} (+${Number(scanLayer.bestOpportunity.upside || 0).toFixed(1)}%)`
                  : 'Sem oportunidade segura'
              }
              subtitle="melhor chance no cenário de agora"
              onOpen={openExpanded}
            />
            <MiniScanCard
              id="scan_top_risk"
              icon={<ShieldAlert className="h-4 w-4 text-rose-600" />}
              label="Top Risco"
              value={scanLayer.topRisk}
              subtitle="o que mais merece cuidado"
              tone="warning"
              onOpen={openExpanded}
            />
            <MiniScanCard
              id="scan_score_status"
              icon={<Gauge className="h-4 w-4 text-blue-600" />}
              label="Score / Status"
              value={
                typeof scanLayer.score === 'number'
                  ? `${scanLayer.score} (${scanLayer.scoreStatus})`
                  : 'Score indisponível'
              }
              subtitle="saúde geral da carteira"
              onOpen={openExpanded}
            />
            <MiniScanCard
              id="scan_market_signal"
              icon={<Globe className="h-4 w-4 text-sky-600" />}
              label="Sinal de Mercado"
              value={
                typeof scanLayer.internationalPct === 'number'
                  ? `Exposição internacional: ${scanLayer.internationalPct.toFixed(2)}%`
                  : 'Exposição internacional indisponível'
              }
              subtitle="quanto você depende só do cenário local"
              tone={
                typeof scanLayer.internationalPct === 'number' &&
                scanLayer.internationalPct < 10
                  ? 'warning'
                  : 'default'
              }
              onOpen={openExpanded}
            />
          </div>
        </section>

        <section className="space-y-3" data-testid="insights-charts-layer">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Gráficos do Momento
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Alocação por classe</CardTitle>
                <CardDescription>Pra ver rápido onde o peso está concentrado</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                {chartLayer.allocationByClass.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados suficientes no momento.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartLayer.allocationByClass} margin={{top: 8, right: 8, left: 8, bottom: 8}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                      <XAxis dataKey="label" tick={{fontSize: 11}} />
                      <YAxis tickFormatter={(value) => `${Number(value).toFixed(0)}%`} tick={{fontSize: 11}} width={44} />
                      <Tooltip
                        content={
                          <CustomTooltip
                            formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Alocação']}
                          />
                        }
                      />
                      <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                        {chartLayer.allocationByClass.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Top exposições</CardTitle>
                <CardDescription>Os ativos que mais puxam o resultado da carteira</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                {chartLayer.topExposures.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem ativos carregados.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartLayer.topExposures} layout="vertical" margin={{top: 8, right: 8, left: 8, bottom: 8}}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                      <XAxis type="number" tickFormatter={(value) => `${Number(value).toFixed(1)}%`} tick={{fontSize: 11}} />
                      <YAxis type="category" dataKey="symbol" width={54} tick={{fontSize: 11}} />
                      <Tooltip
                        content={
                          <CustomTooltip
                            formatter={(value, _name) => [`${Number(value).toFixed(2)}%`, 'Peso']}
                          />
                        }
                      />
                      <Bar dataKey="pct" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">Termômetro de score</CardTitle>
                <CardDescription>Um jeito simples de bater o olho na qualidade atual</CardDescription>
              </CardHeader>
              <CardContent className="h-60">
                {chartLayer.scoreBars.every((item) => item.value === null) ? (
                  <p className="text-sm text-muted-foreground">Sem score disponível agora.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartLayer.scoreBars} margin={{top: 8, right: 8, left: 8, bottom: 8}}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                      <XAxis dataKey="label" tick={{fontSize: 11}} />
                      <YAxis domain={[0, 100]} tick={{fontSize: 11}} width={36} />
                      <Tooltip
                        content={
                          <CustomTooltip
                            formatter={(value) => [
                              Number.isFinite(Number(value))
                                ? `${Number(value).toFixed(0)}/100`
                                : 'Indisponível',
                              'Score',
                            ]}
                          />
                        }
                      />
                      <Bar
                        dataKey={(row: {value: number | null}) =>
                          typeof row.value === 'number' ? row.value : 0
                        }
                        fill="#2563eb"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-3" data-testid="insights-decision-layer">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            O Que Vale Decidir Hoje
          </h2>
          <PriorityCard card={insights.topPriority} onAction={navigate} />

          {opinionCard && (
            <Card className="rounded-2xl border-primary/20" data-testid="insights-opinion-card">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Trackerr Opinion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Leitura Determinística
                  </p>
                  <p>
                    {opinionCard.deterministicFacts[0] ||
                      'Sem leitura determinística disponível.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Síntese IA
                  </p>
                  <p className="italic text-muted-foreground" data-testid="insights-ai-summary">
                    {opinionCard.aiSummary ||
                      'Síntese IA indisponível: exibindo apenas sinais determinísticos.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {insights.secondary.map((card) => (
              <InsightBlock
                key={card.id}
                card={card}
                onAction={navigate}
                onOpenExpanded={openExpanded}
              />
            ))}
          </section>
        </section>

        <section className="space-y-3" data-testid="insights-strategy-layer">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Visão Mais Estratégica
          </h2>
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {insights.strategic.map((card) => (
              <InsightBlock
                key={card.id}
                card={card}
                onAction={navigate}
                onOpenExpanded={openExpanded}
              />
            ))}
          </section>

          <section>
            <InsightBlock
              card={insights.simulation}
              onAction={navigate}
              onOpenExpanded={openExpanded}
            />
          </section>
        </section>

        {!!insights.warnings.length && (
          <Card className="rounded-2xl border-dashed" data-testid="insights-warning-block">
            <CardHeader>
              <CardTitle className="text-sm">Estados degradados detectados</CardTitle>
              <CardDescription>
                Alguns blocos foram renderizados com fallback seguro para evitar inferências indevidas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              {insights.warnings.map((item) => (
                <div key={item}>- {item}</div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <InsightExpandedSheet
        open={expandedOpen}
        onOpenChange={setExpandedOpen}
        payload={expandedPayload}
        onAction={navigate}
      />
    </>
  );
};

const MiniScanCard = ({
  id,
  icon,
  label,
  value,
  subtitle,
  tone = 'default',
  onOpen,
}: {
  id: ScanExpandedId;
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  tone?: 'default' | 'warning';
  onOpen: (id: string) => void;
}) => (
  <Card
    className={cn(
      'rounded-xl transition-colors hover:border-primary/40',
      tone === 'warning' &&
        'border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-950/25',
    )}
    data-testid={`scan-card-${id}`}>
    <CardContent className="p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-sm font-semibold leading-tight line-clamp-2">{value}</p>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => onOpen(id)}>
        Entender melhor
      </Button>
    </CardContent>
  </Card>
);

function readSnapshot(): PortfolioInsightSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as PortfolioInsightSnapshot;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: PortfolioInsightSnapshot): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore persistence failure
  }
}

function normalizeAssets(
  rawAssets: any[],
): Array<{symbol: string; type: string; value: number}> {
  return (rawAssets || [])
    .map((asset) => ({
      symbol: String(asset?.symbol || '').toUpperCase(),
      type: String(asset?.type || '').toLowerCase(),
      value:
        Number(asset?.quantity || 0) *
        Number(asset?.current_price || asset?.price || 0),
    }))
    .filter((asset) => asset.symbol && asset.value > 0);
}

function resolveAssetClass(type: string): 'equities' | 'fiis' | 'crypto' | 'fixed_income' | 'other' {
  const normalized = String(type || '').toLowerCase();
  if (normalized.includes('fii')) return 'fiis';
  if (normalized.includes('crypto')) return 'crypto';
  if (
    normalized.includes('fixed') ||
    normalized.includes('renda_fixa') ||
    normalized.includes('renda fixa') ||
    normalized.includes('bond')
  ) {
    return 'fixed_income';
  }
  if (
    normalized.includes('stock') ||
    normalized.includes('acao') ||
    normalized.includes('ações') ||
    normalized.includes('equity') ||
    normalized.includes('etf') ||
    normalized.includes('bdr')
  ) {
    return 'equities';
  }
  return 'other';
}

function isLikelyInternational(symbol: string, type: string): boolean {
  const normalizedSymbol = String(symbol || '').toUpperCase();
  const normalizedType = String(type || '').toLowerCase();
  return (
    normalizedSymbol.endsWith('34') ||
    normalizedSymbol.endsWith('39') ||
    normalizedSymbol.includes('USD') ||
    normalizedSymbol.includes('IVVB') ||
    normalizedType.includes('crypto')
  );
}

const SeverityPill = ({severity}: {severity: InsightCard['severity']}) => (
  <span
    className={cn(
      'text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full border',
      severity === 'critical' && 'bg-rose-500/10 text-rose-700 border-rose-300',
      severity === 'high' && 'bg-amber-500/10 text-amber-700 border-amber-300',
      severity === 'medium' && 'bg-blue-500/10 text-blue-700 border-blue-300',
      severity === 'low' && 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
    )}>
    {severity}
  </span>
);

const PriorityCard = ({
  card,
  onAction,
}: {
  card: InsightCard;
  onAction: (route: string) => void;
}) => (
  <Card
    className="rounded-2xl border-primary/30 bg-primary/5"
    data-testid="insights-priority-card">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Target className="h-5 w-5 text-primary" /> {card.title}
      </CardTitle>
      <CardDescription>
        Esse é o ponto mais importante do dia pra carteira.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center gap-2">
        <SeverityPill severity={card.severity} />
        <span className="text-xs text-muted-foreground">
          Confiança: {card.confidence}
        </span>
      </div>
      <ul className="space-y-1 text-sm">
        {card.deterministicFacts.map((fact) => (
          <li key={fact} className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 mt-0.5 text-primary" />
            <span>{fact}</span>
          </li>
        ))}
      </ul>
      {card.primaryAction && card.primaryAction.route && (
        <Button
          onClick={() => onAction(card.primaryAction!.route!)}
          className="rounded-xl"
          size="sm">
          {card.primaryAction.label}
        </Button>
      )}
    </CardContent>
  </Card>
);

const InsightBlock = ({
  card,
  onAction,
  onOpenExpanded,
}: {
  card: InsightCard;
  onAction: (route: string) => void;
  onOpenExpanded: (id: string) => void;
}) => {
  const icon = resolveInsightIcon(card.type);
  return (
    <Card className="rounded-2xl" data-testid={`insight-card-${card.type}`}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {card.title}
          </CardTitle>
          <SeverityPill severity={card.severity} />
        </div>
        <CardDescription className="text-xs">
          Confiança: {card.confidence}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {card.unavailableReason ? (
          <p className="text-muted-foreground" data-testid={`unavailable-${card.type}`}>
            Estado indisponível: {card.unavailableReason}
          </p>
        ) : (
          <ul className="space-y-1">
            {card.deterministicFacts.map((fact) => (
              <li key={fact} className="flex items-start gap-2">
                <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        )}

        {card.consequenceIfAction && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
            <strong>Se agir:</strong> {card.consequenceIfAction}
          </p>
        )}
        {card.consequenceIfInaction && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            <strong>Se não agir:</strong> {card.consequenceIfInaction}
          </p>
        )}

        <div className="flex gap-2 flex-wrap">
          {card.primaryAction?.route && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(card.primaryAction!.route!)}>
              {card.primaryAction.label}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenExpanded(card.id)}
            data-testid={`expand-${card.type}`}>
            Entender melhor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const InsightExpandedSheet = ({
  open,
  onOpenChange,
  payload,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: ExpandedInsightPayload | null;
  onAction: (route: string) => void;
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {payload?.title || 'Detalhes do insight'}
          </SheetTitle>
          <SheetDescription>
            Aqui vai o contexto completo, sem enrolação: o que está acontecendo e qual ação faz mais sentido.
          </SheetDescription>
        </SheetHeader>

        {!payload ? (
          <div className="mt-4 text-sm text-muted-foreground">
            Nenhum contexto expandido disponível.
          </div>
        ) : (
          <div className="mt-6 space-y-5" data-testid="insight-expanded-sheet">
            <div className="text-sm font-medium">{payload.shortSummary}</div>

            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Explicação detalhada
              </h3>
              <ul className="space-y-1 text-sm">
                {payload.detailedExplanation.map((line) => (
                  <li key={line}>- {line}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Fatos determinísticos
              </h3>
              <ul className="space-y-1 text-sm">
                {payload.deterministicFacts.map((line) => (
                  <li key={line}>- {line}</li>
                ))}
              </ul>
            </section>

            {payload.aiSynthesis && (
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Síntese IA
                </h3>
                <p className="text-sm italic text-muted-foreground">{payload.aiSynthesis}</p>
              </section>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-500/35 dark:bg-emerald-950/30">
                <p className="font-semibold text-emerald-700 mb-1 dark:text-emerald-300">Se agir</p>
                <p>{payload.actionIfTaken || 'Sem impacto adicional informado.'}</p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-500/35 dark:bg-amber-950/30">
                <p className="font-semibold text-amber-700 mb-1 dark:text-amber-300">Se não agir</p>
                <p>{payload.consequenceIfIgnored || 'Sem custo relevante identificado no momento.'}</p>
              </div>
            </section>

            {payload.visualData?.type !== 'none' && (
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Visualização de apoio
                </h3>
                <div className="rounded-lg border p-3 space-y-2 text-sm" data-testid="expanded-visual-data">
                  {(payload.visualData?.rows || []).map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <span className="truncate">{row.label}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {typeof row.current === 'number' && typeof row.target === 'number'
                          ? `${row.current.toFixed(1)} -> ${row.target.toFixed(1)}`
                          : typeof row.value === 'number'
                            ? row.value.toFixed(2)
                            : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!!payload.suggestedActions.length && (
              <section className="space-y-2">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Próximas ações
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {payload.suggestedActions.slice(0, 3).map((action) => (
                    <Button
                      key={`${action.label}:${action.route || 'no-route'}`}
                      size="sm"
                      variant="outline"
                      onClick={() => action.route && onAction(action.route)}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              </section>
            )}

            {(payload.degradedState || payload.unavailableReason) && (
              <section className="rounded-lg border-dashed border p-3 text-xs text-muted-foreground">
                Estado degradado: {payload.unavailableReason || 'dados parciais para este contexto expandido.'}
              </section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

function resolveInsightIcon(type: InsightCard['type']) {
  switch (type) {
    case 'investment_score_explanation':
      return <TrendingUp className="h-4 w-4 text-primary" />;
    case 'hidden_risks':
      return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    case 'opportunity_radar':
      return <Target className="h-4 w-4 text-emerald-600" />;
    case 'auto_rebalance':
      return <Scale className="h-4 w-4 text-blue-600" />;
    case 'tax_readiness':
      return <Calculator className="h-4 w-4 text-amber-600" />;
    case 'portfolio_evolution':
      return <History className="h-4 w-4 text-slate-600" />;
    case 'future_simulator':
      return <FlaskConical className="h-4 w-4 text-purple-600" />;
    case 'if_you_act_today':
      return <Sparkles className="h-4 w-4 text-primary" />;
    case 'cost_of_inaction':
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case 'trackerr_opinion':
      return <Sparkles className="h-4 w-4 text-primary" />;
    default:
      return <ArrowRight className="h-4 w-4 text-primary" />;
  }
}

export default AIInsights;
