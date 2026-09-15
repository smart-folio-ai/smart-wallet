import React, {useState} from 'react';
import {toast} from 'sonner';
import {AiGeneratedNotice} from '@/components/ui/ai-generated-notice';
import {RagAskPanel} from '@/components/ai/RagAskPanel';
import {useSubscription} from '@/hooks/useSubscription';
import {useAdaptiveLevel} from '@/contexts/AdaptiveLevelContext';
import {getAiPlanFromPlanName, isProOrHigherPlan} from '@/services/ai/trakkerAi';
import {useAiInsightsData, type AiInsightsData} from '@/hooks/useAiInsightsData';
import {useFutureSimulator} from '@/hooks/useFutureSimulator';
import {InsightFeedCard} from '@/components/ai-insights/InsightFeedCard';
import {LevelSignalsCard} from '@/components/ai-insights/LevelSignalsCard';
import {buildSignalRows} from '@/components/ai-insights/level-signals';
import {ModelCard, type ModelCardRow} from '@/components/ai-insights/ModelCard';
import {FutureSimulatorCard} from '@/components/ai-insights/FutureSimulatorCard';
import {
  AllocationProposalCard,
  PortfolioOpinionCard,
  UpgradeCard,
} from '@/components/ai-insights/AnalysisSideCards';
import {
  ALL_TAB,
  buildFeedInsights,
  buildInsightTabs,
} from '@/components/ai-insights/insight-feed';
import {
  CARD_STYLE,
  GHOST_BUTTON_CLASS,
  MUTED_TEXT_STYLE,
  SMALL_BUTTON_STYLE,
  segStyle,
} from '@/components/ai-insights/insights.styles';

function formatRunTime(timestamp: number): string {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
  const isToday = date.toDateString() === new Date().toDateString();
  return isToday
    ? `hoje, ${time}`
    : `${date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}, ${time}`;
}

// Rótulos iguais aos da ficha do handoff; o que a API ainda não expõe
// (janela, retenção, revisão humana) fica em "—" em vez de valor de exemplo.
function buildModelCardRows(data: AiInsightsData | undefined, updatedAt: number): ModelCardRow[] {
  const models = [data?.score?.modelVersion, data?.radar?.modelVersion].filter(Boolean);
  return [
    {label: 'Modelo', value: models.length ? models.join(' · ') : '—'},
    {label: 'Janela de dados', value: '—'},
    {label: 'Última execução', value: data && updatedAt ? formatRunTime(updatedAt) : '—'},
    {label: 'Fontes', value: data ? 'Carteira e cotações' : '—'},
    {label: 'Retenção de logs', value: '—'},
    {label: 'Revisão humana', value: '—'},
  ];
}

const AIInsights: React.FC = () => {
  const {tier, isSubscribed, isLoading: subLoading} = useSubscription();
  const {level, profile, setLevel, clearOverride} = useAdaptiveLevel();
  const [filter, setFilter] = useState(ALL_TAB);

  const isPremium = isProOrHigherPlan(tier, isSubscribed);
  const insightsQuery = useAiInsightsData({
    plan: getAiPlanFromPlanName(tier),
    enabled: !subLoading && isPremium,
  });
  const simulator = useFutureSimulator(level !== 'iniciante');

  const data = insightsQuery.data;
  const isLoading = subLoading || (isPremium && insightsQuery.isLoading);
  // Com dado anterior em cache, uma atualização que falha mantém o feed.
  const hasError = isPremium && insightsQuery.isError && !data;
  const aiData = data?.analysis.ai_analysis ?? data?.analysis;
  const allocation = aiData?.rebalancing?.ideal_allocation ?? [];

  const insights = buildFeedInsights({
    radar: data?.radar ?? null,
    analysis: data?.analysis ?? null,
    radarUpdatedAt: data ? insightsQuery.dataUpdatedAt : null,
  });
  const tabs = buildInsightTabs(insights);
  // Se a categoria escolhida sumiu após atualizar, volta para "Tudo".
  const activeFilter = tabs.some((tab) => tab.label === filter) ? filter : ALL_TAB;
  const visibleInsights = insights.filter(
    (insight) => activeFilter === ALL_TAB || insight.category === activeFilter,
  );
  const showAiNotice = visibleInsights.some((insight) => insight.aiGenerated);
  const radarClear = data?.radar?.status === 'ok' && data.radar.alerts.length === 0;
  const now = Date.now();

  const toggleManualControl = () => {
    if (profile?.source === 'user_override') {
      clearOverride();
      toast.info('Controle devolvido à IA', {
        description: 'O nível volta a acompanhar seus sinais de uso.',
      });
      return;
    }
    // Fixar o nível atual grava o override no servidor: a IA para de ajustar.
    setLevel(level);
    toast.info('Controle manual ativado', {
      description: 'A IA para de ajustar o nível. Você pode trocá-lo no seletor do topo.',
    });
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <div
        className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]"
        style={{gap: 16.8, alignItems: 'start'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 11.2}}>
          <div style={{display: 'flex', gap: 5.6, flexWrap: 'wrap', alignItems: 'center'}}>
            {tabs.map((tab) => (
              <button
                key={tab.label}
                type="button"
                aria-pressed={activeFilter === tab.label}
                onClick={() => setFilter(tab.label)}
                style={segStyle(activeFilter === tab.label)}>
                {tab.label}
                <span style={{marginLeft: 5.6, color: 'var(--color-neutral-600)'}}>{tab.count}</span>
              </button>
            ))}
            {isPremium && (
              <button
                type="button"
                aria-label="Atualizar análise"
                title="Atualizar análise"
                onClick={() => insightsQuery.refetch()}
                disabled={insightsQuery.isFetching}
                className={GHOST_BUTTON_CLASS}
                style={{...SMALL_BUTTON_STYLE, marginLeft: 'auto', width: 28, padding: 0, display: 'grid', placeItems: 'center'}}>
                <i className="ph ph-arrow-clockwise" style={{fontSize: 13}} />
              </button>
            )}
          </div>

          {!isPremium && !subLoading && <UpgradeCard />}

          {isLoading && (
            <section style={{...CARD_STYLE, padding: '14px 16.8px'}}>
              <div style={MUTED_TEXT_STYLE}>Trackerr IA está analisando sua carteira…</div>
            </section>
          )}

          {hasError && (
            <section style={{...CARD_STYLE, padding: '14px 16.8px', display: 'flex', alignItems: 'center', gap: 11.2}}>
              <i className="ph ph-warning-circle" style={{fontSize: 16, color: 'var(--neg)'}} />
              <div style={{...MUTED_TEXT_STYLE, flex: 1}}>
                Não foi possível carregar os insights agora. Tente novamente em alguns instantes.
              </div>
              <button
                type="button"
                onClick={() => insightsQuery.refetch()}
                className={GHOST_BUTTON_CLASS}
                style={SMALL_BUTTON_STYLE}>
                Tentar novamente
              </button>
            </section>
          )}

          {data?.radarFailed && (
            <section style={{...CARD_STYLE, padding: '14px 16.8px', display: 'flex', alignItems: 'center', gap: 11.2}}>
              <div style={{...MUTED_TEXT_STYLE, flex: 1}}>Não foi possível carregar o radar.</div>
              <button
                type="button"
                onClick={() => insightsQuery.refetch()}
                className={GHOST_BUTTON_CLASS}
                style={SMALL_BUTTON_STYLE}>
                Tentar novamente
              </button>
            </section>
          )}

          {radarClear && activeFilter === ALL_TAB && (
            <section style={{...CARD_STYLE, padding: '14px 16.8px'}}>
              <div style={MUTED_TEXT_STYLE}>
                Nenhum alerta no momento — sinais de concentração, diversificação e risco dentro do esperado.
              </div>
            </section>
          )}

          {data && !radarClear && !data.radarFailed && insights.length === 0 && (
            <section style={{...CARD_STYLE, padding: '14px 16.8px'}}>
              <div style={MUTED_TEXT_STYLE}>Nenhum insight disponível no momento.</div>
            </section>
          )}

          {visibleInsights.map((insight) => (
            <InsightFeedCard
              key={insight.id}
              insight={insight}
              showDepth={level !== 'iniciante'}
              now={now}
            />
          ))}

          {showAiNotice && <AiGeneratedNotice />}

          <section style={{...CARD_STYLE, padding: 16.8}}>
            <RagAskPanel
              contextLabel="sua carteira"
              placeholder="Pergunte sobre a sua carteira..."
              quickPrompts={[
                'Por que minha carteira está concentrada?',
                'Qual o maior risco da minha carteira hoje?',
                'Como estão meus dividendos projetados?',
              ]}
            />
          </section>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
          <LevelSignalsCard
            level={level}
            profile={profile}
            rows={buildSignalRows(data?.score ?? null, profile)}
            onToggleManualControl={toggleManualControl}
          />
          <ModelCard rows={buildModelCardRows(data, insightsQuery.dataUpdatedAt)} />
          {aiData?.portfolio_assessment && (
            <PortfolioOpinionCard assessment={aiData.portfolio_assessment} />
          )}
          {allocation.length > 0 && <AllocationProposalCard items={allocation} />}
        </div>
      </div>

      <FutureSimulatorCard simulator={simulator} />
    </div>
  );
};

export default AIInsights;
