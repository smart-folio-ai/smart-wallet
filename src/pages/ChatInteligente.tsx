import {useEffect, useMemo, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {MessageSquare, Send, AlertTriangle, Bot, User2, Sparkles, RotateCcw} from 'lucide-react';
import {useSubscription} from '@/hooks/useSubscription';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {isProOrHigherPlan} from '@/services/ai/trakkerAi';
import {askStructuredChat, StructuredChatResponse} from '@/services/chat';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status?: 'ok' | 'error';
  retryQuestion?: string;
  payload?: StructuredChatResponse;
};

const QUICK_PROMPTS = [
  'Minha carteira está concentrada?',
  'Compare PETR4 e VALE3',
  'Quanto imposto pago se vender ITUB4?',
  'Mostre o risco da minha carteira',
  'Esse ativo faz sentido para minha carteira? PETR4',
  'Qual meu resumo da carteira hoje?',
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
  const externalAsset = data.externalAsset as any;
  const portfolioFacts = data.portfolioFacts as any;
  const externalData = data.externalData as any;
  const estimates = data.estimates as any;
  const suggestions = (data as any)?.suggestions as string[] | undefined;

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
            {portfolioRisk.concentrationByAsset?.[0]?.symbol || 'N/D'} ·{' '}
            {`${Number(portfolioRisk.concentrationByAsset?.[0]?.weightPct ?? 0).toFixed(1)}%`}
          </p>
        </div>
      )}

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
          <p className="text-sm text-foreground">
            {payload.warnings.slice(0, 3).map(w => {
              const dict: Record<string, string> = {
                'sell_simulation_requires_owned_asset': 'Ativo não possuído',
                'comparison_requires_two_assets': 'Ativos insuficientes para comparar',
                'tax_estimation_requires_owned_asset': 'Imposto não calculado',
                'external_asset_data_unavailable': 'Sem cotação de mercado atual',
              };
              return dict[w] || w;
            }).join(' · ')}
          </p>
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
    </div>
  );
}

export default function ChatInteligente() {
  const {planName, isSubscribed, isLoading: loadingSubscription} = useSubscription();
  const hasProOrHigher = isProOrHigherPlan(planName, isSubscribed);

  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const canSend = question.trim().length > 0 && !sending && hasProOrHigher;

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

  const sendQuestion = async (rawQuestion: string) => {
    const trimmed = String(rawQuestion || '').trim();
    if (!trimmed || sending || !hasProOrHigher) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      status: 'ok',
    };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setSending(true);

    try {
      const response = await askStructuredChat(trimmed);
      const assistantText =
        response.message?.trim() ||
        'Análise estruturada concluída com base nos dados disponíveis.';
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: assistantText,
          status: 'ok',
          payload: response,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: 'Não consegui responder agora. Você pode tentar novamente.',
          status: 'error',
          retryQuestion: trimmed,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto py-6 md:py-8">
      <div className="mb-4 md:mb-6 space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-primary" />
          Chat Inteligente
        </h1>
        <p className="text-muted-foreground">
          Assistente da Trackerr com respostas estruturadas da carteira, mercado e simulações.
        </p>
      </div>

      <PremiumBlur
        locked={!hasProOrHigher}
        title="Chat Inteligente é PRO+"
        description="Faça upgrade para conversar com o assistente inteligente da Trackerr.">
        <Card className="relative overflow-hidden border-border/60 bg-gradient-to-b from-background to-background/40 min-h-[72vh]">
          <div className="pointer-events-none absolute -top-24 right-0 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  Copilot da Carteira
                </CardTitle>
                <CardDescription>
                  Fatos da carteira, dados externos e estimativas exibidos separadamente.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary">
                Premium
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div
              ref={scrollRef}
              data-testid="chat-scroll-area"
              className="h-[52vh] md:h-[58vh] overflow-y-auto px-4 py-4 md:px-6 space-y-4">
              {introVisible && (
                <div data-testid="chat-empty-state" className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Perguntas úteis para começar
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Faça perguntas sobre concentração, comparação, imposto, risco e encaixe na carteira.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <Button
                        key={prompt}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full border-primary/30 bg-primary/5 hover:bg-primary/10"
                        onClick={() => sendQuestion(prompt)}>
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => {
                const isAssistant = message.role === 'assistant';
                return (
                  <div
                    key={message.id}
                    data-testid={`chat-message-${message.role}`}
                    className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[92%] md:max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                        isAssistant
                          ? 'border border-border/70 bg-card text-card-foreground'
                          : 'bg-primary text-primary-foreground'
                      }`}>
                      <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                        {isAssistant ? <Bot className="h-3.5 w-3.5" /> : <User2 className="h-3.5 w-3.5" />}
                        <span>{isAssistant ? 'Trackerr' : 'Você'}</span>
                      </div>
                      {isAssistant ? (
                        <div data-testid="chat-assistant-summary">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                            Resumo
                          </p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      )}

                      {isAssistant && <ResponseEvidence payload={message.payload} />}

                      {isAssistant && message.payload && <AssistantStructuredBlocks payload={message.payload} />}

                      {message.status === 'error' && message.retryQuestion && (
                        <div className="mt-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => sendQuestion(message.retryQuestion || '')}>
                            <RotateCcw className="h-3.5 w-3.5 mr-2" />
                            Tentar novamente
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {sending && (
                <div data-testid="chat-loading" className="flex justify-start">
                  <div className="max-w-[78%] rounded-2xl border border-border/70 bg-card px-4 py-3">
                    <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                      <Bot className="h-3.5 w-3.5" />
                      <span>Trackerr</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-pulse" />
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-pulse [animation-delay:120ms]" />
                      <span className="h-2 w-2 rounded-full bg-primary/60 animate-pulse [animation-delay:240ms]" />
                      analisando...
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 border-t border-border/60 bg-background/95 backdrop-blur px-4 py-3 md:px-6">
              <div className="mb-2 flex flex-wrap gap-2" data-testid="chat-prompt-chips">
                {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                  <Button
                    key={`chip-${prompt}`}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-full border border-border/60 text-xs"
                    onClick={() => sendQuestion(prompt)}>
                    {prompt}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      sendQuestion(question);
                    }
                  }}
                  placeholder="Pergunte sobre carteira, comparação, imposto, risco ou encaixe..."
                  aria-label="Pergunta do chat"
                />
                <Button type="button" onClick={() => sendQuestion(question)} disabled={!canSend}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>

              {loadingSubscription && (
                <p className="mt-2 text-xs text-muted-foreground">Validando seu plano...</p>
              )}
              {!hasProOrHigher && !loadingSubscription && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Recurso disponível para plano PRO ou superior.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </PremiumBlur>
    </div>
  );
}
