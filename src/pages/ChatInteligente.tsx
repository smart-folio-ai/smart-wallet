import {useEffect, useMemo, useRef, useState} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Badge} from '@/components/ui/badge';
import {ChatMentionInput} from '@/components/chat/ChatMentionInput';
import {useSubscription} from '@/hooks/useSubscription';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {AiGeneratedNotice} from '@/components/ui/ai-generated-notice';
import {isProOrHigherPlan} from '@/services/ai/trakkerAi';
import {
  askStructuredCopilotChat,
  askStructuredChat,
  appendChatHistoryMessage,
  fetchChatHistory,
  StructuredChatResponse,
} from '@/services/chat';
import {SectionHeader} from '@/components/shared';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status?: 'ok' | 'error';
  retryQuestion?: string;
  payload?: StructuredChatResponse;
  /**
   * True apenas quando o texto exibido em `text` veio do modelo. Respostas
   * determinísticas e os literais de fallback do cliente são escritos aqui,
   * não pelo LLM, e não podem exibir o aviso de conteúdo gerado por IA.
   */
  aiGenerated?: boolean;
};

const QUICK_PROMPTS = [
  'Minha carteira está concentrada?',
  'Compare PETR4 e VALE3',
  'Quanto imposto pago se vender ITUB4?',
  'Mostre o risco da minha carteira',
  'Esse ativo faz sentido para minha carteira? PETR4',
  'Qual meu resumo da carteira hoje?',
];

const COPILOT_FLOWS: Array<{
  label: string;
  question: string;
  flow: 'sell_asset' | 'rebalance_portfolio' | 'reduce_risk_20' | 'committee_mode';
}> = [
  {
    label: 'Quero vender PETR4',
    question: 'Quero vender PETR4',
    flow: 'sell_asset',
  },
  {
    label: 'Quero rebalancear',
    question: 'Quero rebalancear minha carteira',
    flow: 'rebalance_portfolio',
  },
  {
    label: 'Quero reduzir risco em 20%',
    question: 'Quero reduzir risco em 20%',
    flow: 'reduce_risk_20',
  },
  {
    label: 'Gerar comitê semanal',
    question: 'Gerar comitê de investimento semanal',
    flow: 'committee_mode',
  },
];

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/D';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value);
}

function ResponseEvidence({payload}: {payload?: StructuredChatResponse}) {
  if (!payload) return null;
  const hasPortfolioFacts = Boolean(
    (payload.data as any)?.portfolioSummary ||
      (payload.data as any)?.portfolioRisk ||
      (payload.data as any)?.portfolioFacts,
  );
  const hasExternalData = Boolean(
    (payload.data as any)?.externalAsset ||
      (payload.data as any)?.comparison ||
      (payload.data as any)?.externalData,
  );
  const hasSimulation = Boolean(
    (payload.data as any)?.sellSimulation || (payload.data as any)?.estimates,
  );

  return (
    <div className="mt-3 flex flex-wrap gap-2" data-testid="chat-evidence-badges">
      {hasPortfolioFacts && (
        <Badge variant="secondary" className="text-[11px]">
          Baseado na carteira
        </Badge>
      )}
      {hasExternalData && (
        <Badge variant="secondary" className="text-[11px]">
          Dados externos de mercado
        </Badge>
      )}
      {hasSimulation && (
        <Badge variant="secondary" className="text-[11px]">
          Estimativa simulada
        </Badge>
      )}
      {payload.deterministic && (
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[11px]">
          Cálculo determinístico
        </Badge>
      )}
    </div>
  );
}

function AssistantStructuredBlocks({payload}: {payload?: StructuredChatResponse}) {
  if (!payload) return null;
  const data = payload.data || {};
  const comparison = data.comparison as any;
  const sellSimulation = data.sellSimulation as any;
  const portfolioRisk = data.portfolioRisk as any;
  const portfolioSummary = data.portfolioSummary as any;
  const portfolioAssets = Array.isArray((data as any)?.portfolioAssets)
    ? ((data as any).portfolioAssets as Array<any>)
    : [];
  const externalAsset = data.externalAsset as any;
  const portfolioFacts = data.portfolioFacts as any;
  const externalData = data.externalData as any;
  const estimates = data.estimates as any;
  const suggestions = (data as any)?.suggestions as string[] | undefined;
  const trackerrScore = (data as any)?.trackerrScore as any;
  const tradePlaybook = (data as any)?.tradePlaybook as any;
  const riTimeline = (data as any)?.riTimeline as Array<any> | undefined;
  const personalizedInsights = (data as any)?.personalizedInsights as any;
  const investmentCommittee = (data as any)?.investmentCommittee as any;
  const rebalanceSuggestion = (data as any)?.rebalanceSuggestion as any;
  const topRiskAsset = portfolioRisk?.concentrationByAsset?.[0];
  const topRiskAssetPct =
    Number(topRiskAsset?.weightPct ?? topRiskAsset?.percentage ?? 0) || 0;

  return (
    <div className="mt-3 space-y-3" data-testid="chat-structured-details">
      {portfolioSummary && (
        <div
          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3"
          data-testid="chat-block-portfolio-summary">
          <p className="text-xs uppercase tracking-wide text-emerald-300">Resposta da Carteira</p>
          <p className="text-sm text-foreground">
            Valor total: {formatCurrency(portfolioSummary.totalValue)}
          </p>
          {portfolioAssets.length > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">
              Ativos: {portfolioAssets
                .slice(0, 6)
                .map((asset) => {
                  const pct = Number(asset?.allocationPct || 0);
                  return `${asset?.symbol || 'Ativo'} (${pct.toFixed(1)}%)`;
                })
                .join(' · ')}
            </p>
          ) : null}
        </div>
      )}

      {comparison?.results && (
        <div
          className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-3"
          data-testid="chat-block-comparison">
          <p className="text-xs uppercase tracking-wide text-sky-300">Comparação</p>
          <p className="text-sm text-foreground">
            {Array.isArray(comparison.results)
              ? comparison.results.map((item: any) => item.symbol).filter(Boolean).join(' vs ')
              : 'Comparação disponível'}
          </p>
        </div>
      )}

      {sellSimulation && (
        <div
          className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3"
          data-testid="chat-block-tax-result">
          <p className="text-xs uppercase tracking-wide text-amber-300">Imposto / Simulação</p>
          <p className="text-sm text-foreground">
            Imposto estimado: {formatCurrency(sellSimulation.estimatedTax)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PnL realizado: {formatCurrency(sellSimulation.realizedPnl)} · Classificação:{' '}
            {sellSimulation.classification || 'N/D'}
          </p>
        </div>
      )}

      {portfolioRisk?.risk && (
        <div
          className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3"
          data-testid="chat-block-risk">
          <p className="text-xs uppercase tracking-wide text-rose-300">Risco</p>
          <p className="text-sm text-foreground">
            Score: {portfolioRisk.risk.score ?? 'N/D'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Top concentração (ativo):{' '}
            {topRiskAsset?.symbol || topRiskAsset?.key || 'N/D'} ·{' '}
            {`${topRiskAssetPct.toFixed(1)}%`}
          </p>
        </div>
      )}

      {rebalanceSuggestion?.riskScore ? (
        <div
          className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3"
          data-testid="chat-block-rebalance-suggestion">
          <p className="text-xs uppercase tracking-wide text-cyan-300">
            Sugestão de Balanceamento (Estimativa)
          </p>
          <p className="text-sm text-foreground">
            Perfil {rebalanceSuggestion.profile || 'conservador'} · reduzir risco em{' '}
            {Number(rebalanceSuggestion.riskScore.targetReductionPct || 0).toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Alvo de score: {Number(rebalanceSuggestion.riskScore.targetSuggested || 0).toFixed(1)} ·
            Limite por ativo: {Number(rebalanceSuggestion.targetRanges?.maxAssetConcentrationPct || 0).toFixed(0)}%
          </p>
          {Array.isArray(rebalanceSuggestion.targetAllocationMix) &&
          rebalanceSuggestion.targetAllocationMix.length > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">
              Mix sugerido:{' '}
              {rebalanceSuggestion.targetAllocationMix
                .slice(0, 5)
                .map((item: any) => `${item.bucket}: ${Number(item.targetPct || 0).toFixed(0)}%`)
                .join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}

      {externalAsset && (
        <div
          className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-3"
          data-testid="chat-block-external-asset">
          <p className="text-xs uppercase tracking-wide text-violet-300">Ativo Fora da Carteira</p>
          <p className="text-sm text-foreground">
            {externalAsset.symbol || 'Ativo'} · Preço {formatCurrency(externalAsset.price)}
          </p>
        </div>
      )}

      {portfolioFacts && !portfolioSummary && !portfolioRisk && (
        <div
          className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3"
          data-testid="chat-block-portfolio-facts">
          <p className="text-xs uppercase tracking-wide text-emerald-300">Fatos da Carteira</p>
          <p className="text-sm text-foreground">
            {portfolioFacts.symbol
              ? `Ativo: ${portfolioFacts.symbol}`
              : `Posições na carteira: ${portfolioFacts.positionsCount ?? portfolioFacts.portfolioAssetsCount ?? 'N/D'}`}
          </p>
        </div>
      )}

      {externalData && !externalAsset && !comparison && (
        <div
          className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-3"
          data-testid="chat-block-external-data">
          <p className="text-xs uppercase tracking-wide text-violet-300">Dados Externos</p>
          <p className="text-sm text-foreground">
            Dados de mercado usados na resposta.
          </p>
        </div>
      )}

      {estimates && !sellSimulation && (
        <div
          className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3"
          data-testid="chat-block-estimates">
          <p className="text-xs uppercase tracking-wide text-amber-300">Estimativas</p>
          <p className="text-sm text-foreground">
            Estimativas calculadas para apoiar a decisão.
          </p>
        </div>
      )}

      {payload.warnings?.length ? (
        <div
          className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3"
          data-testid="chat-block-warnings">
          <p className="text-xs uppercase tracking-wide text-yellow-300">Avisos</p>
          <p className="text-sm text-foreground">{payload.warnings.slice(0, 3).join(' · ')}</p>
        </div>
      ) : null}

      {payload.unavailable?.length ? (
        <div
          className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3"
          data-testid="chat-block-unavailable">
          <p className="text-xs uppercase tracking-wide text-yellow-300">Limitações de Dados</p>
          <p className="text-sm text-foreground">{payload.unavailable.slice(0, 3).join(' · ')}</p>
        </div>
      ) : null}

      {suggestions?.length ? (
        <div
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3"
          data-testid="chat-block-suggestions">
          <p className="text-xs uppercase tracking-wide text-blue-300">Próximas Ações</p>
          <p className="text-sm text-foreground">{suggestions.slice(0, 2).join(' · ')}</p>
        </div>
      ) : null}

      {trackerrScore?.overall ? (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
          <p className="text-xs uppercase tracking-wide text-blue-300">Trackerr Score</p>
          <p className="text-sm text-foreground">
            Score geral: {trackerrScore.overall} / 100
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pesos visíveis: Qualidade {Math.round(((trackerrScore.weights?.quality ?? trackerrScore.weights?.qualidade) || 0) * 100)}% ·
            Risco {Math.round(((trackerrScore.weights?.risk ?? trackerrScore.weights?.risco) || 0) * 100)}% ·
            Valuation {Math.round((trackerrScore.weights?.valuation || 0) * 100)}%
          </p>
        </div>
      ) : null}

      {tradePlaybook?.preTrade ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs uppercase tracking-wide text-amber-300">Pré/Pós Trade Fiscal</p>
          <p className="text-sm text-foreground">
            Pré-trade: imposto estimado {formatCurrency(tradePlaybook.preTrade.estimatedTax)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pós-trade: impacto na carteira {Number((tradePlaybook.postTrade?.portfolioImpactPct ?? tradePlaybook.postTrade?.portfolioImpactPercent) || 0).toFixed(2)}% ·
            DARF estimado {formatCurrency(tradePlaybook.postTrade?.estimatedDarf)}
          </p>
        </div>
      ) : null}

      {riTimeline?.length ? (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-3">
          <p className="text-xs uppercase tracking-wide text-violet-300">Timeline RI</p>
          <p className="text-sm text-foreground">
            Últimos releases comparados: {riTimeline.map((item) => item.period || 'N/D').join(' → ')}
          </p>
        </div>
      ) : null}

      {investmentCommittee?.modelVersion ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
          <p className="text-xs uppercase tracking-wide text-emerald-300">Comitê de Investimento</p>
          <p className="text-sm text-foreground">
            Recomendações: {(investmentCommittee.recommended || investmentCommittee.recommendedAssets || [])
              .map((item: any) => (typeof item === 'string' ? item : item.symbol))
              .join(', ') || 'N/D'}
          </p>
          {(investmentCommittee.recommended || []).length > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">
              Motivos (top recomendações): {(investmentCommittee.recommended || [])
                .slice(0, 2)
                .map((item: any) => {
                  const symbol = typeof item === 'string' ? item : item?.symbol || 'Ativo';
                  const reason =
                    Array.isArray(item?.reasons) && item.reasons.length > 0
                      ? item.reasons[0]
                      : null;
                  return reason ? `${symbol}: ${reason}` : symbol;
                })
                .join(' · ') || 'N/D'}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground mt-1">
            Evitar: {(investmentCommittee.avoid || investmentCommittee.avoidAssets || [])
              .map((item: any) => (typeof item === 'string' ? item : item.symbol))
              .join(', ') || 'N/D'}
          </p>
          {(investmentCommittee.avoid || []).length > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">
              Motivos (itens para evitar): {(investmentCommittee.avoid || [])
                .slice(0, 2)
                .map((item: any) => {
                  const symbol = typeof item === 'string' ? item : item?.symbol || 'Ativo';
                  const reason =
                    Array.isArray(item?.reasons) && item.reasons.length > 0
                      ? item.reasons[0]
                      : null;
                  return reason ? `${symbol}: ${reason}` : symbol;
                })
                .join(' · ') || 'N/D'}
            </p>
          ) : null}
          {Array.isArray(investmentCommittee.criticalRisks) &&
          investmentCommittee.criticalRisks.length > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">
              Riscos críticos: {investmentCommittee.criticalRisks.slice(0, 2).join(' · ')}
            </p>
          ) : null}
          {Array.isArray(investmentCommittee.objectivePlan) &&
          investmentCommittee.objectivePlan.length > 0 ? (
            <p className="text-xs text-muted-foreground mt-1">
              Plano da semana: {investmentCommittee.objectivePlan.slice(0, 2).join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}

      {personalizedInsights?.narrative ? (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
          <p className="text-xs uppercase tracking-wide text-cyan-300">Narrativa por Perfil</p>
          <p className="text-sm text-foreground">{personalizedInsights.narrative}</p>
          <p className="text-xs text-muted-foreground mt-1">{personalizedInsights.recommendedAction}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function ChatInteligente() {
  const {planName, isSubscribed, isLoading: loadingSubscription} = useSubscription();
  const hasProOrHigher = isProOrHigherPlan(planName, isSubscribed);

  const [question, setQuestion] = useState('');
  const [investorProfile, setInvestorProfile] = useState<
    'renda' | 'crescimento' | 'conservador' | 'agressivo'
  >('conservador');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const historyHydratedRef = useRef(false);

  const canSend = question.trim().length > 0 && !sending && hasProOrHigher;

  // Histórico persistido (TRA-66). Só busca quando o usuário de fato tem
  // acesso ao recurso — evita uma chamada inútil para quem está atrás do
  // PremiumBlur, e mantém o mesmo gate visto no restante da página.
  const chatHistoryQuery = useQuery({
    queryKey: ['chat-intelligent-history'],
    queryFn: fetchChatHistory,
    enabled: hasProOrHigher,
    staleTime: 60_000,
  });

  // Persistência fire-and-forget: uma falha ao salvar não deve travar a
  // conversa em andamento, então os erros são apenas engolidos aqui — a
  // mensagem já está visível localmente independente do resultado.
  const persistMessageMutation = useMutation({
    mutationFn: appendChatHistoryMessage,
    onError: () => {},
  });

  useEffect(() => {
    if (historyHydratedRef.current) return;
    if (!chatHistoryQuery.data) return;
    historyHydratedRef.current = true;
    setMessages(
      chatHistoryQuery.data.map((entry) => ({
        id: entry.clientId,
        role: entry.role,
        text: entry.text,
        status: entry.status,
        retryQuestion: entry.retryQuestion,
        payload: entry.payload as unknown as StructuredChatResponse | undefined,
        aiGenerated: entry.aiGenerated,
      })),
    );
  }, [chatHistoryQuery.data]);

  useEffect(() => {
    if (!scrollRef.current) return;
    if (typeof scrollRef.current.scrollTo !== 'function') return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sending]);

  const introVisible = useMemo(
    () => messages.filter((message) => message.role === 'user').length === 0,
    [messages],
  );

  const sendQuestion = async (
    rawQuestion: string,
    options?: {
      copilotFlow?: 'sell_asset' | 'rebalance_portfolio' | 'reduce_risk_20' | 'committee_mode';
    },
  ) => {
    const trimmed = String(rawQuestion || '').trim();
    if (!trimmed || sending || !hasProOrHigher) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      status: 'ok',
    };
    setMessages((prev) => [...prev, userMessage]);
    persistMessageMutation.mutate({
      clientId: userMessage.id,
      role: 'user',
      text: userMessage.text,
      status: 'ok',
    });
    setQuestion('');
    setSending(true);

    try {
      const response = options?.copilotFlow
        ? await askStructuredCopilotChat({
            question: trimmed,
            investorProfile,
            copilotFlow: options.copilotFlow,
          })
        : await askStructuredChat(trimmed);
      const modelText = response.message?.trim() || '';
      const assistantText =
        response.intent === 'market_screening'
          ? 'Ainda não consigo filtrar ações do mercado por indicador (P/VP, dividend yield, ROE). Os dados fundamentalistas que tenho são apenas dos ativos que você já tem em carteira — posso analisar esses, comparar dois deles, ou avaliar concentração e risco da sua posição.'
          : modelText ||
            'Análise estruturada concluída com base nos dados disponíveis.';
      const aiGenerated =
        Boolean(modelText) &&
        !response.deterministic &&
        response.route?.type !== 'deterministic_no_llm';
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: assistantText,
        status: 'ok',
        payload: response,
        aiGenerated,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      persistMessageMutation.mutate({
        clientId: assistantMessage.id,
        role: 'assistant',
        text: assistantMessage.text,
        status: 'ok',
        payload: assistantMessage.payload as unknown as Record<string, unknown>,
        aiGenerated: assistantMessage.aiGenerated,
      });
    } catch {
      const errorMessage: ChatMessage = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: 'Não consegui responder agora. Você pode tentar novamente.',
        status: 'error',
        retryQuestion: trimmed,
      };
      setMessages((prev) => [...prev, errorMessage]);
      persistMessageMutation.mutate({
        clientId: errorMessage.id,
        role: 'assistant',
        text: errorMessage.text,
        status: 'error',
        retryQuestion: errorMessage.retryQuestion,
      });
    } finally {
      setSending(false);
    }
  };

  // suppress unused-variable warning — investorProfile is read by the sidebar context display
  void setInvestorProfile;

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', padding: '28px 16px'}}>
      <PremiumBlur
        locked={!hasProOrHigher}
        title="Chat Inteligente é PRO+"
        description="Faça upgrade para conversar com o assistente inteligente da Trackerr.">
        <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 16, alignItems: 'start'}}>

          {/* LEFT — chat panel */}
          <section
            data-testid="chat-panel"
            style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', minHeight: 620, display: 'flex', flexDirection: 'column'}}>

            {/* Header */}
            <div style={{padding: '12px 16px', borderBottom: '1px solid var(--hair-soft)', display: 'flex', alignItems: 'center', gap: 10}}>
              <i className="ph-fill ph-sparkle" style={{fontSize: 16, color: 'var(--ac)'}} />
              <div>
                <div style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600}}>Copiloto Trackerr</div>
                <div style={{fontSize: 11, color: 'var(--color-neutral-600)'}}>Análise em tempo real da sua carteira</div>
              </div>
              <span style={{marginLeft: 'auto', fontSize: 10.5, padding: '2px 8px', borderRadius: 10, background: 'var(--badge-cy-bg)', color: 'var(--cy)'}}>
                contexto: carteira consolidada
              </span>
            </div>

            {/* Message area */}
            <div
              ref={scrollRef}
              data-testid="chat-scroll-area"
              style={{flex: 1, overflowY: 'auto', padding: '16.8px', display: 'flex', flexDirection: 'column', gap: '16.8px'}}>

              {/* Empty state */}
              {introVisible && (
                <div data-testid="chat-empty-state" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 40}}>
                  <i className="ph-fill ph-sparkle" style={{fontSize: 32, color: 'var(--ac)'}} />
                  <div style={{fontSize: 13, color: 'var(--color-neutral-500)', textAlign: 'center'}}>Como posso ajudar com sua carteira hoje?</div>
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center'}}>
                    {QUICK_PROMPTS.map(p => (
                      <button key={p} type="button" onClick={() => sendQuestion(p)}
                        style={{height: 28, padding: '0 12px', borderRadius: 14, border: '1px solid var(--hair)', background: 'transparent', fontSize: 11.5, color: 'var(--color-neutral-400)', cursor: 'pointer'}}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  data-testid={`chat-message-${msg.role}`}
                  style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'}}>
                  {msg.role === 'assistant' && (
                    <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
                      <i className="ph-fill ph-sparkle" style={{fontSize: 12, color: 'var(--ac)'}} />
                      <span style={{fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>Copiloto</span>
                    </div>
                  )}
                  <div style={{
                    maxWidth: '85%', padding: '10px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.6,
                    background: msg.role === 'user' ? 'var(--ac)' : 'var(--surf-3)',
                    color: msg.role === 'user' ? '#fff' : 'var(--color-neutral-200)',
                    border: msg.role === 'assistant' ? '1px solid var(--hair)' : 'none',
                  }}>
                    {msg.role === 'assistant' ? (
                      <div data-testid="chat-assistant-summary">
                        <p style={{fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-neutral-600)', marginBottom: 4}}>Resumo</p>
                        <p style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                      </div>
                    ) : (
                      <p style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                    )}

                    {msg.role === 'assistant' && <ResponseEvidence payload={msg.payload} />}
                    {msg.role === 'assistant' && msg.payload && <AssistantStructuredBlocks payload={msg.payload} />}

                    {msg.role === 'assistant' && msg.status !== 'error' && msg.aiGenerated && (
                      <div style={{marginTop: 8}}>
                        <AiGeneratedNotice />
                      </div>
                    )}

                    {msg.status === 'error' && msg.retryQuestion && (
                      <div style={{marginTop: 12}}>
                        <button
                          type="button"
                          onClick={() => sendQuestion(msg.retryQuestion || '')}
                          style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--hair)', background: 'var(--surf-3)', fontSize: 12, color: 'var(--color-neutral-400)', cursor: 'pointer'}}>
                          <i className="ph-fill ph-arrow-counter-clockwise" style={{fontSize: 13}} />
                          Tentar novamente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {sending && (
                <div data-testid="chat-loading" style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 5}}>
                    <i className="ph-fill ph-sparkle" style={{fontSize: 12, color: 'var(--ac)'}} />
                    <span style={{fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>Copiloto</span>
                  </div>
                  <div style={{padding: '10px 14px', borderRadius: 8, background: 'var(--surf-3)', border: '1px solid var(--hair)', display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--color-neutral-500)'}}>
                    <span style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--ac)', opacity: 0.6, display: 'inline-block'}} className="animate-pulse" />
                    <span style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--ac)', opacity: 0.6, display: 'inline-block'}} className="animate-pulse [animation-delay:120ms]" />
                    <span style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--ac)', opacity: 0.6, display: 'inline-block'}} className="animate-pulse [animation-delay:240ms]" />
                    analisando...
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div style={{borderTop: '1px solid var(--hair-soft)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10}}>
              {/* COPILOT_FLOWS chips */}
              <div data-testid="chat-prompt-chips" style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
                {COPILOT_FLOWS.map(f => (
                  <button key={f.flow} type="button" onClick={() => sendQuestion(f.question, {copilotFlow: f.flow})}
                    style={{height: 28, padding: '0 12px', borderRadius: 14, border: '1px solid var(--hair)', background: 'transparent', fontSize: 11.5, color: 'var(--color-neutral-400)', cursor: 'pointer'}}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Input + send */}
              <div style={{display: 'flex', gap: 8, border: '1px solid var(--hair)', borderRadius: 8, padding: '8px 12px', alignItems: 'flex-end'}}>
                <ChatMentionInput
                  value={question}
                  onValueChange={setQuestion}
                  onEnter={() => sendQuestion(question)}
                  placeholder="Pergunte sobre sua carteira… (use @ para mencionar um ativo)"
                  disabled={sending || !hasProOrHigher}
                />
                <button
                  type="button"
                  aria-label="Enviar"
                  onClick={() => sendQuestion(question)}
                  disabled={!canSend}
                  style={{flexShrink: 0, width: 32, height: 32, borderRadius: 6, border: 'none', background: 'var(--ac)', color: '#fff', cursor: canSend ? 'pointer' : 'not-allowed', display: 'grid', placeItems: 'center', opacity: canSend ? 1 : 0.5}}>
                  <i className="ph-fill ph-paper-plane-right" style={{fontSize: 14}} />
                </button>
              </div>

              {loadingSubscription && (
                <p style={{fontSize: 11, color: 'var(--color-neutral-600)'}}>Validando seu plano...</p>
              )}
              {!hasProOrHigher && !loadingSubscription && (
                <div style={{display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-neutral-500)'}}>
                  <i className="ph-fill ph-warning" style={{fontSize: 13}} />
                  Recurso disponível para plano PRO ou superior.
                </div>
              )}
              <div style={{fontSize: 10, color: 'var(--color-neutral-600)'}}>Conteúdo gerado por IA. Não constitui consultoria de investimentos.</div>
            </div>
          </section>

          {/* RIGHT — context + history */}
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>

            {/* Contexto em uso */}
            <div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
              <SectionHeader title="Contexto em uso" />
              <div style={{padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10}}>
                {[
                  {icon: 'ph-chart-pie', label: 'Carteira consolidada', meta: 'atualizada agora'},
                  {icon: 'ph-calendar', label: 'Histórico 12 meses', meta: 'dividendos + trades'},
                  {icon: 'ph-user-circle', label: `Perfil ${investorProfile ?? 'Moderado'}`, meta: 'detectado automaticamente'},
                ].map(ctx => (
                  <div key={ctx.label} style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <i className={`ph-fill ${ctx.icon}`} style={{fontSize: 16, color: 'var(--ac)', flexShrink: 0}} />
                    <div>
                      <div style={{fontSize: 12.5, fontWeight: 500}}>{ctx.label}</div>
                      <div style={{fontSize: 11, color: 'var(--color-neutral-600)'}}>{ctx.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Histórico */}
            <div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
              <SectionHeader title="Histórico" />
              <div style={{padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8}}>
                {messages.filter(m => m.role === 'user').slice(-5).reverse().map(m => (
                  <div key={m.id} style={{display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12}}>
                    <span style={{color: 'var(--color-neutral-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1}}>{m.text}</span>
                    <span style={{color: 'var(--color-neutral-600)', flexShrink: 0, fontSize: 10.5}}>agora</span>
                  </div>
                ))}
                {messages.filter(m => m.role === 'user').length === 0 && (
                  <div style={{fontSize: 11.5, color: 'var(--color-neutral-600)'}}>Nenhuma pergunta ainda.</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </PremiumBlur>
    </div>
  );
}
