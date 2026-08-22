import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Bot, Send, AlertTriangle, Sparkles} from 'lucide-react';
import {AiGeneratedNotice} from '@/components/ui/ai-generated-notice';
import {askStructuredChat, StructuredChatResponse} from '@/services/chat';

type PanelState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'answered'; text: string; aiGenerated: boolean}
  | {status: 'error'; question: string};

export interface RagAskPanelProps {
  /** Prompts sugeridos, já contextualizados (ex.: incluem o ticker). */
  quickPrompts?: string[];
  placeholder?: string;
  /**
   * Rótulo curto do contexto (ex.: "PETR4", "sua carteira"). Só compõe a
   * mensagem de estado de carregamento — o escopo real do RAG é sempre do
   * usuário, garantido no backend.
   */
  contextLabel?: string;
}

/**
 * Painel de pergunta única ao RAG (TRA-39). Não é um chat completo: uma
 * pergunta, uma resposta, contextualizada no ativo ou na carteira onde o
 * painel está embutido. Reusa `askStructuredChat`, que já passa pelo
 * orquestrador — o RAG entra na síntese pra planos com acesso (TRA-76), e
 * autorização é responsabilidade do backend, não deste componente.
 */
export function RagAskPanel({
  quickPrompts = [],
  placeholder = 'Pergunte algo sobre este contexto...',
  contextLabel,
}: RagAskPanelProps) {
  const [question, setQuestion] = useState('');
  const [state, setState] = useState<PanelState>({status: 'idle'});

  async function ask(rawQuestion: string) {
    const q = rawQuestion.trim();
    if (!q || state.status === 'loading') return;
    setState({status: 'loading'});
    try {
      const response: StructuredChatResponse = await askStructuredChat(q);
      // Mesmo critério do ChatInteligente: só marca "gerado por IA" quando a
      // resposta veio do modelo, não do caminho determinístico.
      const aiGenerated =
        Boolean(response.message) &&
        !response.deterministic &&
        response.route?.type !== 'deterministic_no_llm';
      setState({
        status: 'answered',
        text:
          response.message ||
          'Não consegui responder essa pergunta agora. Tente reformular.',
        aiGenerated,
      });
    } catch {
      setState({status: 'error', question: q});
    }
  }

  function handleSubmit() {
    void ask(question);
  }

  return (
    <div className="space-y-3" data-testid="rag-ask-panel">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-bold">Pergunte à Trackerr IA</p>
      </div>

      {quickPrompts.length > 0 && state.status === 'idle' && (
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuestion(prompt);
                void ask(prompt);
              }}
              className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors">
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={placeholder}
          rows={2}
          className="resize-none text-sm"
        />
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!question.trim() || state.status === 'loading'}
          className="shrink-0 self-end"
          aria-label="Enviar pergunta">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {state.status === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4 animate-pulse text-primary" />
          Consultando os dados{contextLabel ? ` de ${contextLabel}` : ''}...
        </div>
      )}

      {state.status === 'answered' && (
        <div className="flex gap-3 rounded-2xl border border-primary/10 bg-white/50 p-4 dark:bg-card/50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {state.text}
            </p>
            {state.aiGenerated && <AiGeneratedNotice />}
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm">
          <span className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Não foi possível consultar agora.
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void ask(state.question)}>
            Tentar de novo
          </Button>
        </div>
      )}
    </div>
  );
}
