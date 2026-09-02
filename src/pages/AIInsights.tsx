import React, {useState, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {AiGeneratedNotice} from '@/components/ui/ai-generated-notice';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
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
import {formatCurrency} from '@/utils/formatters';
import {resolveScoreTone} from '@/utils/score-tone';
import type {ScoreTone} from '@/utils/score-tone';
import {useSubscription} from '@/hooks/useSubscription';
import {RagAskPanel} from '@/components/ai/RagAskPanel';
import {InvestorProfileBadge} from '@/components/ai/InvestorProfileBadge';
import {
  getInvestorProfile,
  setInvestorProfileOverride,
  InvestorProfileResponse,
} from '@/services/ai/investorProfile';
import {
  getAiPlanFromPlanName,
  getOrCreateAiAnalysis,
  isProOrHigherPlan,
} from '@/services/ai/trakkerAi';
import {SectionHeader} from '@/components/shared';

// ─── Constants ───────────────────────────────────────────────────────────────

const ERROR_RADAR_TYPE_LABEL: Record<PortfolioErrorRadarAlertType, string> = {
  concentration: 'Concentração',
  diversification: 'Diversificação',
  volatility: 'Volatilidade',
  other: 'Risco',
};

const HORIZON_OPTIONS: {value: FutureSimulatorHorizon; label: string}[] = [
  {value: '6m', label: '6 meses'},
  {value: '1y', label: '1 ano'},
  {value: '5y', label: '5 anos'},
  {value: '10y', label: '10 anos'},
];

const SEVERITY_ORDER: Record<'high' | 'medium' | 'low', number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** Maps InsightCard.priority → CSS color token */
const PRIORITY_COLOR: Record<string, string> = {
  Alta: 'var(--neg)',
  Média: 'var(--warn)',
  Baixa: 'var(--pos)',
};

/** Maps InsightCard.priority → display chip label */
const PRIORITY_DISPLAY: Record<string, string> = {
  Alta: 'ALTO',
  Média: 'MÉDIO',
  Baixa: 'BAIXO',
};

/** Nocturne-token inline styles for the simulator result panel per ScoreTone */
const SIM_TONE_STYLE: Record<ScoreTone, React.CSSProperties> = {
  warning: {background: 'var(--badge-warn-bg)', border: '1px solid var(--warn)'},
  neutral: {background: 'var(--sunk)', border: '1px solid var(--hair)'},
  positive: {background: 'var(--badge-pos-bg)', border: '1px solid var(--pos)'},
};


const INSIGHT_TABS = ['Todos', 'Oportunidades', 'Alertas', 'Estratégias'] as const;
type InsightTab = typeof INSIGHT_TABS[number];

// ─── Local types ─────────────────────────────────────────────────────────────

interface InsightCard {
  priority: 'Alta' | 'Média' | 'Baixa';
  category: string;
  title: string;
  body: string;
  note?: string;
  confidence?: number;
  sources?: string;
  when?: string;
  /** Symbol badge (shown as its own element) */
  symbol?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const AIInsights: React.FC = () => {
  const {planName, isSubscribed, isLoading: subLoading} = useSubscription();
  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portfolioScore, setPortfolioScore] = useState<PortfolioScoreResponse | null>(null);
  const [errorRadar, setErrorRadar] = useState<PortfolioErrorRadarResponse | null>(null);
  // Distingue "ainda nao buscado" (usuario free, fetchData nem tenta) de
  // "buscou e falhou de verdade" — errorRadar === null cobre os dois casos e
  // nao pode ser usado sozinho para decidir se mostra o estado de falha.
  const [errorRadarFailed, setErrorRadarFailed] = useState(false);

  // Estados para Simulação
  const [monthlyInvest, setMonthlyInvest] = useState(1000);
  const [horizon, setHorizon] = useState<FutureSimulatorHorizon>('10y');
  const [simulation, setSimulation] = useState<FutureSimulatorResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [cdiComparison, setCdiComparison] = useState<number | null>(null);

  // viewMode: estado originalmente introduzido em versão mínima pela Task 9
  // (comparação com CDI), que só precisava ler/persistir a preferência via
  // localStorage. Esta Task (8) é a dona "real" do estado — adiciona o fetch
  // do perfil do investidor e a sugestão de modo avançado baseada nele (ver
  // useEffect abaixo), além do toggle na UI que efetivamente escreve em
  // localStorage. O estado em si não é redeclarado aqui.
  const [investorProfile, setInvestorProfile] = useState<InvestorProfileResponse | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'advanced'>('standard');
  const [insightTab, setInsightTab] = useState<InsightTab>('Todos');

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
    setErrorRadarFailed(false);

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

      // Score de carteira e radar de erro vêm do backend determinístico e são
      // independentes entre si e da análise do LLM: se o trackerr-ia estiver
      // fora, os dois ainda aparecem, e vice-versa. Por isso allSettled em
      // vez de await sequencial.
      const [analysisOutcome, scoreOutcome, errorRadarOutcome, profileOutcome] =
        await Promise.allSettled([
          getOrCreateAiAnalysis({rawAssets: assets, plan: aiPlan}),
          aiAnalysisService.portfolioScore(),
          aiAnalysisService.errorRadar(),
          getInvestorProfile(),
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
        setErrorRadarFailed(true);
      }

      // O perfil de investidor é independente das demais fontes: falhar não
      // deve derrubar o resto da página — o badge já trata `null` como "não
      // renderizar nada".
      if (profileOutcome.status === 'fulfilled') {
        setInvestorProfile(profileOutcome.value);
        // A preferência salva pelo usuário sempre vence; só sugerimos o modo
        // avançado a partir do perfil quando não há nada salvo ainda.
        const savedMode = localStorage.getItem('ai_insights_view_mode');
        if (savedMode === 'standard' || savedMode === 'advanced') {
          setViewMode(savedMode);
        } else if (profileOutcome.value.sophistication === 'experienced') {
          setViewMode('advanced');
        }
      } else {
        setInvestorProfile(null);
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

  const handleProfileOverride = async (override: {
    sophistication?: 'beginner' | 'intermediate' | 'experienced';
  }) => {
    try {
      const updated = await setInvestorProfileOverride(override);
      setInvestorProfile(updated);
    } catch {
      toast.error('Não foi possível salvar a alteração de perfil.');
    }
  };

  const handleViewModeChange = (checked: boolean) => {
    const mode = checked ? 'advanced' : 'standard';
    setViewMode(mode);
    localStorage.setItem('ai_insights_view_mode', mode);
    // Mesmo padrão de "troca de parâmetro invalida resultado" usado no
    // slider e nos botões de horizonte: uma simulação já calculada no modo
    // antigo não deve continuar visível como se refletisse o modo novo.
    setSimulation(null);
    setCdiComparison(null);
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
    } catch {
      setSimulation(null);
      setCdiComparison(null);
      toast.error('Não foi possível calcular a projeção.');
    } finally {
      setSimLoading(false);
    }
  };

  // ─── Loading guard ──────────────────────────────────────────────────────────

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 16,
        }}>
        <i className="ph-fill ph-spinner" style={{fontSize: 40, color: 'var(--ac)'}} />
        <p style={{color: 'var(--color-neutral-500)', fontWeight: 500}}>
          Trackerr IA está analisando seu patrimônio...
        </p>
      </div>
    );

  // ─── Derived values ─────────────────────────────────────────────────────────

  const aiData = analysisResult?.ai_analysis || analysisResult;
  const isPremium = hasProOrHigher;

  // Score determinístico (GET /ai/portfolio-score). `overall` é null quando a
  // carteira não tem posição suficiente — nunca 0, que seria lido como
  // "carteira péssima" em vez de "sem dado".
  const overallScore =
    portfolioScore?.status === 'ok' && portfolioScore.overall !== null
      ? portfolioScore.overall
      : null;

  const simulationTone = simulation
    ? resolveScoreTone(
        simulation.scenarios.base.projectedValue >
          simulation.currentPortfolioValue * 1.5
          ? 80
          : 50,
      )
    : 'neutral';

  // ─── Error guard ────────────────────────────────────────────────────────────

  if (error && !analysisResult) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 16,
        }}>
        <i
          className="ph-fill ph-shield-warning"
          style={{fontSize: 48, color: 'var(--neg)'}}
        />
        <h2 style={{fontSize: 20, fontWeight: 700, margin: 0}}>
          Ops! Algo deu errado.
        </h2>
        <p
          style={{
            color: 'var(--color-neutral-500)',
            textAlign: 'center',
            maxWidth: 400,
            margin: 0,
          }}>
          {error}
        </p>
        <Button onClick={fetchData} variant="outline" className="rounded-xl">
          <i
            className="ph-fill ph-arrow-clockwise"
            style={{marginRight: 8, fontSize: 14}}
          />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // ─── Insight derivation ─────────────────────────────────────────────────────

  const sortedAlerts = [...(errorRadar?.alerts || [])].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
  const highCount = sortedAlerts.filter((a) => a.severity === 'high').length;
  const mediumCount = sortedAlerts.filter((a) => a.severity === 'medium').length;

  const alertInsights: InsightCard[] = sortedAlerts.map((a) => ({
    priority:
      a.severity === 'high' ? 'Alta' : a.severity === 'medium' ? 'Média' : 'Baixa',
    category: ERROR_RADAR_TYPE_LABEL[a.type],
    title: a.message,
    body: a.symbol ? 'Portfólio concentrado' : 'Portfólio geral',
    note: `Código: ${a.code}`,
    symbol: a.symbol,
  }));

  const oppInsights: InsightCard[] = (aiData?.opportunity_radar ?? []).map((o) => ({
    priority: 'Média' as const,
    category: 'Oportunidade',
    title: o.symbol,
    body: o.rationale,
  }));

  const stratInsights: InsightCard[] = (aiData?.rebalancing?.top_moves ?? []).map(
    (m) => ({
      priority: 'Baixa' as const,
      category: 'Estratégia',
      title: m,
      body: 'Movimentação sugerida pelo modelo de rebalanceamento.',
    }),
  );

  const allInsights = [...alertInsights, ...oppInsights, ...stratInsights];

  const visibleInsights =
    insightTab === 'Todos'
      ? allInsights
      : insightTab === 'Alertas'
        ? alertInsights
        : insightTab === 'Oportunidades'
          ? oppInsights
          : stratInsights;

  /** Opp insights are in the current view — show AiGeneratedNotice. */
  const showOppNotice =
    oppInsights.length > 0 &&
    (insightTab === 'Todos' || insightTab === 'Oportunidades');

  // Score signals for the right sidebar (dimensions only — overall shown separately)
  const scoreSignals = (portfolioScore?.dimensions ?? []).map((d) => ({
    label: d.key === 'diversification' ? 'Diversificação' : 'Controle de risco',
    value: d.score,
    max: 100,
  }));

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '28px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
      {/* Page title */}
      <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
        <i className="ph-fill ph-sparkle" style={{fontSize: 18, color: 'var(--ac)'}} />
        <span
          style={{fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600}}>
          Insights IA
        </span>
        <button
          type="button"
          aria-label="Atualizar análise"
          onClick={fetchData}
          style={{
            marginLeft: 4,
            height: 28,
            width: 28,
            borderRadius: '50%',
            border: '1px solid var(--hair)',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
          <i
            className="ph-fill ph-arrow-clockwise"
            style={{fontSize: 14, color: 'var(--color-neutral-500)'}}
          />
        </button>
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
          <InvestorProfileBadge
            profile={investorProfile}
            onOverride={handleProfileOverride}
          />
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <label
              htmlFor="view-mode-toggle"
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-neutral-500)',
              }}>
              Avançado
            </label>
            <Switch
              id="view-mode-toggle"
              aria-label="Modo avançado"
              checked={viewMode === 'advanced'}
              onCheckedChange={handleViewModeChange}
            />
          </div>
          {isPremium && <BadgePremium />}
        </div>
      </div>

      {/* Two-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)',
          gap: 16,
          alignItems: 'start',
        }}>
        {/* LEFT — insight feed */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          {/* Tab bar */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: '0 0 8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
            {INSIGHT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={insightTab === tab}
                onClick={() => setInsightTab(tab)}
                style={{
                  height: 28,
                  padding: '0 12px',
                  borderRadius: 14,
                  fontSize: 11.5,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  background:
                    insightTab === tab ? 'var(--ac)' : 'var(--surf-3)',
                  color:
                    insightTab === tab ? '#fff' : 'var(--color-neutral-400)',
                }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Alert summary — always shown when alerts exist (regardless of tab) */}
          {sortedAlerts.length > 0 && (
            <p
              style={{
                margin: 0,
                fontSize: 10.5,
                color: 'var(--color-neutral-600)',
              }}>
              {sortedAlerts.length === 1 ? '1 alerta' : `${sortedAlerts.length} alertas`}{' '}
              — {highCount} alto(s), {mediumCount} médio(s)
            </p>
          )}

          {/* No-alerts notice — always shown when radar ok and no alerts */}
          {errorRadar?.status === 'ok' && sortedAlerts.length === 0 && (
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: 'var(--color-neutral-500)',
              }}>
              Nenhum alerta no momento — sinais de concentração, diversificação e
              risco dentro do esperado.
            </p>
          )}

          {/* Radar failed notice — always shown when radar couldn't load */}
          {errorRadarFailed && (
            <div
              style={{
                padding: '12px 16px',
                border: '1px solid var(--hair)',
                borderRadius: 8,
                background: 'var(--nk-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
              <span style={{fontSize: 12.5, color: 'var(--color-neutral-500)'}}>
                Não foi possível carregar o radar.
              </span>
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
                className="rounded-xl">
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Empty state */}
          {visibleInsights.length === 0 && !errorRadarFailed && (
            <div
              style={{
                padding: '24px',
                border: '1px dashed var(--hair)',
                borderRadius: 8,
                textAlign: 'center',
                fontSize: 12.5,
                color: 'var(--color-neutral-500)',
              }}>
              {insightTab === 'Todos'
                ? 'Nenhum insight disponível no momento.'
                : `Nenhum insight na categoria "${insightTab}".`}
            </div>
          )}

          {/* Insight cards */}
          {visibleInsights.map((insight, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--hair)',
                borderRadius: 8,
                background: 'var(--nk-card)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
              {/* Header row: priority badge + symbol + category */}
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: 10,
                    background: PRIORITY_COLOR[insight.priority] + '22',
                    color: PRIORITY_COLOR[insight.priority],
                  }}>
                  {PRIORITY_DISPLAY[insight.priority]}
                </span>
                {insight.symbol && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'var(--surf-3)',
                      color: 'var(--color-neutral-400)',
                    }}>
                    {insight.symbol}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'var(--color-neutral-600)',
                    marginLeft: 'auto',
                  }}>
                  {insight.category}
                </span>
              </div>
              {/* Title */}
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14.5,
                  fontWeight: 600,
                  lineHeight: 1.35,
                }}>
                {insight.title}
              </div>
              {/* Body */}
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--color-neutral-400)',
                  lineHeight: 1.6,
                }}>
                {insight.body}
              </div>
              {/* Depth note */}
              {insight.note && (
                <div
                  style={{
                    borderLeft: '2px solid var(--color-accent-700)',
                    paddingLeft: 10,
                    fontSize: 11.5,
                    color: 'var(--color-neutral-500)',
                    lineHeight: 1.5,
                  }}>
                  {insight.note}
                </div>
              )}
              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  fontSize: 10.5,
                  color: 'var(--color-neutral-600)',
                  borderTop: '1px solid var(--hair-soft)',
                  paddingTop: 8,
                }}>
                {insight.confidence !== undefined && (
                  <span>Confiança: {insight.confidence}%</span>
                )}
                {insight.sources && <span>Fontes: {insight.sources}</span>}
                {insight.when && <span>{insight.when}</span>}
              </div>
              {/* Action buttons */}
              <div style={{display: 'flex', gap: 8}}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 6,
                    border: '1px solid var(--hair)',
                    background: 'transparent',
                    fontSize: 11.5,
                    color: 'var(--color-neutral-400)',
                    cursor: 'pointer',
                  }}>
                  Trilha de auditoria
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 6,
                    border: '1px solid var(--color-accent-700)',
                    background: 'transparent',
                    fontSize: 11.5,
                    color: 'var(--color-accent-300)',
                    cursor: 'pointer',
                  }}>
                  Ver análise completa
                </button>
              </div>
            </div>
          ))}

          {/* AiGeneratedNotice when opportunity insights are visible */}
          {showOppNotice && <AiGeneratedNotice />}

          {/* RAG Ask Panel */}
          <div
            style={{
              border: '1px solid var(--hair)',
              borderRadius: 8,
              background: 'var(--nk-card)',
              padding: '16px',
            }}>
            <RagAskPanel
              contextLabel="sua carteira"
              placeholder="Pergunte sobre a sua carteira..."
              quickPrompts={[
                'Por que minha carteira está concentrada?',
                'Qual o maior risco da minha carteira hoje?',
                'Como estão meus dividendos projetados?',
              ]}
            />
          </div>

          {!isPremium && <UpgradeBanner />}
        </div>

        {/* RIGHT — model sidebar */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          {/* Como a IA definiu seu nível */}
          <div
            style={{
              border: '1px solid var(--hair)',
              borderRadius: 8,
              background: 'var(--nk-card)',
            }}>
            <SectionHeader title="Como a IA definiu seu nível" />
            <div
              style={{
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
              {/* Score display */}
              <div style={{textAlign: 'center', padding: '8px 0 4px'}}>
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: 'var(--ac)',
                    lineHeight: 1,
                  }}>
                  {overallScore ?? '--'}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-neutral-600)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: 4,
                  }}>
                  Score da carteira
                </div>
                {portfolioScore?.status === 'insufficient_data' && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-neutral-500)',
                      marginTop: 4,
                    }}>
                    Sem dados suficientes
                  </div>
                )}
              </div>

              {/* Só diversificação e risco: consistência e volatilidade não
                  têm cálculo determinístico e foram removidas em vez de
                  exibirem número inventado pelo LLM (TRA-5). */}
              {scoreSignals.map((sig) => (
                <div
                  key={sig.label}
                  style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--color-neutral-400)',
                      width: 120,
                      flexShrink: 0,
                    }}>
                    {sig.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--sunk)',
                      overflow: 'hidden',
                    }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min((sig.value / sig.max) * 100, 100)}%`,
                        background: 'var(--ac)',
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontVariantNumeric: 'tabular-nums',
                      width: 36,
                      textAlign: 'right',
                    }}>
                    {sig.value}
                  </span>
                </div>
              ))}
              <button
                type="button"
                style={{
                  marginTop: 4,
                  width: '100%',
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid var(--hair)',
                  background: 'transparent',
                  fontSize: 12,
                  color: 'var(--color-neutral-400)',
                  cursor: 'pointer',
                }}>
                Assumir controle manual
              </button>
            </div>
          </div>

          {/* Ficha do modelo */}
          <div
            style={{
              border: '1px solid var(--hair)',
              borderRadius: 8,
              background: 'var(--nk-card)',
            }}>
            <SectionHeader title="Ficha do modelo" />
            <div
              style={{
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
              {[
                {label: 'Modelo', value: 'Trackerr IA v2'},
                {label: 'Atualizado', value: 'Tempo real'},
                {label: 'Dados usados', value: 'Carteira, mercado, fundamentos'},
                {
                  label: 'Regulatório',
                  value: 'Não constitui consultoria de investimento',
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontSize: 12,
                  }}>
                  <span style={{color: 'var(--color-neutral-600)'}}>{row.label}</span>
                  <span
                    style={{
                      color: 'var(--color-neutral-300)',
                      textAlign: 'right',
                      maxWidth: 200,
                    }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Opinião Trackerr */}
          {aiData?.portfolio_assessment && (
            <div
              style={{
                border: '1px solid var(--hair)',
                borderRadius: 8,
                background: 'var(--nk-card)',
              }}>
              <SectionHeader title="Opinião Trackerr" />
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'var(--color-neutral-400)',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                    margin: 0,
                  }}>
                  "{aiData.portfolio_assessment}"
                </p>
                <AiGeneratedNotice />
              </div>
            </div>
          )}

          {/* Proposta de Alocação */}
          {(aiData?.rebalancing?.ideal_allocation ?? []).length > 0 && (
            <div
              style={{
                border: '1px solid var(--hair)',
                borderRadius: 8,
                background: 'var(--nk-card)',
              }}>
              <SectionHeader title="Proposta de Alocação" />
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                {(aiData?.rebalancing?.ideal_allocation ?? []).map((item, i) => (
                  <div
                    key={i}
                    style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11.5,
                        fontWeight: 700,
                      }}>
                      <span>{item.category}</span>
                      <div style={{display: 'flex', gap: 8}}>
                        <span
                          style={{
                            color: 'var(--color-neutral-600)',
                            textDecoration: 'line-through',
                          }}>
                          {item.current.toFixed(1)}%
                        </span>
                        <span style={{color: 'var(--ac)'}}>
                          {item.ideal.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 6,
                        width: '100%',
                        background: 'var(--sunk)',
                        borderRadius: 3,
                        overflow: 'hidden',
                        display: 'flex',
                      }}>
                      <div
                        style={{
                          width: `${item.current}%`,
                          background: 'var(--color-neutral-600)',
                          height: '100%',
                        }}
                      />
                      <div
                        style={{
                          width: `${Math.max(0, item.ideal - item.current)}%`,
                          background: 'var(--ac)',
                          height: '100%',
                          opacity: 0.5,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <AiGeneratedNotice />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulador de Futuro */}
      <div
        style={{
          border: '1px solid var(--hair)',
          borderRadius: 8,
          background: 'var(--nk-card)',
          overflow: 'hidden',
        }}>
        <SectionHeader
          title="Simulador de Futuro"
          subtitle="O que acontece se você investir regularmente?"
        />
        <div style={{padding: '20px 16px'}}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 32,
            }}>
            {/* Controls */}
            <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
              <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    fontWeight: 700,
                  }}>
                  <span>Aporte Mensal</span>
                  <span style={{color: 'var(--ac)', fontFamily: 'monospace'}}>
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
              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                <span style={{fontSize: 13, fontWeight: 700}}>Horizonte</span>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 8,
                  }}>
                  {HORIZON_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setHorizon(option.value);
                        setSimulation(null);
                        setCdiComparison(null);
                      }}
                      style={{
                        borderRadius: 8,
                        padding: '6px 0',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border:
                          horizon === option.value
                            ? '1px solid var(--ac)'
                            : '1px solid var(--hair)',
                        background:
                          horizon === option.value ? 'var(--ac)' : 'transparent',
                        color:
                          horizon === option.value
                            ? '#fff'
                            : 'var(--color-neutral-400)',
                      }}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                style={{
                  width: '100%',
                  height: 44,
                  borderRadius: 8,
                  fontWeight: 700,
                }}
                onClick={handleSimulate}
                disabled={simLoading}>
                {simLoading ? (
                  <>
                    <i
                      className="ph-fill ph-spinner"
                      style={{marginRight: 8, fontSize: 16}}
                    />
                    Calculando...
                  </>
                ) : (
                  'Calcular Projeção IA'
                )}
              </Button>
            </div>

            {/* Result panel */}
            <div
              style={{
                ...SIM_TONE_STYLE[simulationTone],
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
              }}>
              {simulation ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 20,
                    width: '100%',
                  }}>
                  <div>
                    <p
                      style={{
                        fontSize: 10,
                        color: 'var(--color-neutral-600)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        margin: '0 0 8px',
                      }}>
                      Patrimônio Esperado
                    </p>
                    <p
                      style={{
                        fontSize: 36,
                        fontWeight: 900,
                        color: 'var(--ac)',
                        letterSpacing: '-0.02em',
                        margin: '0 0 4px',
                      }}>
                      {formatCurrency(simulation.scenarios.base.projectedValue)}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--color-neutral-600)',
                        margin: 0,
                      }}>
                      {formatCurrency(simulation.scenarios.base.range.lower)}
                      {' – '}
                      {formatCurrency(simulation.scenarios.base.range.upper)}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 20,
                      paddingTop: 16,
                      borderTop: '1px solid var(--hair-soft)',
                    }}>
                    <div>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: 'var(--color-neutral-600)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginBottom: 4,
                        }}>
                        Pessimista
                      </span>
                      <span
                        style={{fontWeight: 900, color: 'var(--neg)', fontSize: 16}}>
                        {formatCurrency(
                          simulation.scenarios.pessimistic.projectedValue,
                        )}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: 'var(--color-neutral-600)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginBottom: 4,
                        }}>
                        Otimista
                      </span>
                      <span
                        style={{fontWeight: 900, color: 'var(--pos)', fontSize: 16}}>
                        {formatCurrency(
                          simulation.scenarios.optimistic.projectedValue,
                        )}
                      </span>
                    </div>
                  </div>
                  {viewMode === 'advanced' && cdiComparison !== null && (
                    <div
                      style={{
                        paddingTop: 12,
                        borderTop: '1px solid var(--hair-soft)',
                        width: '100%',
                      }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: 'var(--color-neutral-600)',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginBottom: 4,
                        }}>
                        CDI acumulado (últimos {simulation.months} meses)
                      </span>
                      <span style={{fontWeight: 900, fontSize: 16}}>
                        {formatCurrency(cdiComparison)}
                      </span>
                      <p
                        style={{
                          fontSize: 10,
                          color: 'var(--color-neutral-600)',
                          margin: '4px 0 0',
                        }}>
                        Estimativa simplificada: aplica o CDI já realizado nos
                        últimos {simulation.months} meses sobre o valor atual da
                        carteira, sem simular os aportes mensais dentro do CDI.
                      </p>
                    </div>
                  )}
                  {simulation.limitations.length > 0 && (
                    <p
                      style={{
                        fontSize: 10,
                        color: 'var(--color-neutral-600)',
                        paddingTop: 8,
                        margin: 0,
                      }}>
                      Projeção com dados parciais da carteira.
                    </p>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    alignItems: 'center',
                  }}>
                  <i
                    className="ph-fill ph-chart-pie"
                    style={{fontSize: 48, color: 'var(--color-neutral-700)'}}
                  />
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--color-neutral-500)',
                      maxWidth: 200,
                      margin: 0,
                    }}>
                    Ajuste os aportes e simule o poder dos juros compostos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const BadgePremium = () => (
  <span
    style={{
      fontSize: 9.5,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      padding: '2px 7px',
      borderRadius: 10,
      background: 'var(--grad-ember)',
      color: '#fff',
    }}>
    Pro Account
  </span>
);

const UpgradeBanner = () => (
  <div
    style={{
      borderRadius: 8,
      background: 'rgba(111,94,217,0.24)',
      border: '1px solid rgba(145,132,217,0.35)',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
    <div
      style={{
        height: 44,
        width: 44,
        borderRadius: 12,
        background: 'rgba(145,132,217,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <i
        className="ph-fill ph-lightning"
        style={{fontSize: 22, color: 'var(--color-accent-300)'}}
      />
    </div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 16,
          fontWeight: 700,
          margin: 0,
        }}>
        Libere o Trackerr Pro
      </h3>
      <p
        style={{
          fontSize: 12.5,
          color: 'var(--color-neutral-400)',
          lineHeight: 1.6,
          margin: 0,
        }}>
        Tenha rebalanceamento automático real-time, acesso a robôs de arbitragem
        e radar de oportunidades expandido.
      </p>
    </div>
    <Button
      variant="secondary"
      style={{width: '100%', borderRadius: 8, fontWeight: 700}}>
      Fazer Upgrade
    </Button>
  </div>
);

export default AIInsights;
