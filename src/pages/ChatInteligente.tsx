import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {portfolioService} from '@/server/api/api';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Skeleton} from '@/components/ui/skeleton';
import {MessageSquare, Send} from 'lucide-react';
import {useSubscription} from '@/hooks/useSubscription';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {answerPortfolioQuestion, isProOrHigherPlan} from '@/services/ai/trakkerAi';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatInteligente() {
  const {planName, isSubscribed, isLoading: loadingSubscription} = useSubscription();
  const hasProOrHigher = isProOrHigherPlan(planName, isSubscribed);
  const [question, setQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Pergunte sobre imposto em venda, risco da carteira ou projeção de dividendos. Vou responder com base nos seus dados reais.',
    },
  ]);

  const {data: assetsResponse, isLoading: loadingAssets} = useQuery({
    queryKey: ['chat-assets'],
    queryFn: async () => (await portfolioService.getAssets()).data,
    enabled: hasProOrHigher,
  });

  const {data: summaryResponse, isLoading: loadingSummary} = useQuery({
    queryKey: ['chat-portfolio-summary'],
    queryFn: async () => (await portfolioService.getSummary()).data,
    enabled: hasProOrHigher,
  });

  const assets = Array.isArray(assetsResponse)
    ? assetsResponse
    : assetsResponse?.assets || [];

  const sendQuestion = async () => {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, {role: 'user', content: trimmed}]);
    setQuestion('');
    setSending(true);

    try {
      const answer = await answerPortfolioQuestion({
        question: trimmed,
        rawAssets: assets,
        summary: summaryResponse,
        planName,
      });
      setMessages((prev) => [...prev, {role: 'assistant', content: answer}]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Não consegui responder agora. Tente novamente em alguns segundos.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-primary" />
          Chat Inteligente
        </h1>
        <p className="text-muted-foreground">
          Converse com a Trakker IA usando os dados reais da sua carteira.
        </p>
      </div>

      <PremiumBlur
        locked={!hasProOrHigher}
        title="Chat Inteligente é PRO+"
        description="Faça upgrade para perguntar livremente sobre risco, impostos e dividendos da sua carteira.">
        <Card className="min-h-[560px]">
          <CardHeader>
            <CardTitle>Assistente da Carteira</CardTitle>
            <CardDescription>
              Exemplos: "Se eu vender metade de PETR4, quanto imposto pago?" ou
              "Minha carteira está muito arriscada?"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(loadingSubscription || loadingAssets || loadingSummary) && (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-4/5" />
              </div>
            )}

            <div className="rounded-lg border p-4 bg-muted/20 space-y-3 max-h-[360px] overflow-auto">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === 'assistant'
                      ? 'rounded-md border bg-background p-3 text-sm'
                      : 'rounded-md bg-primary text-primary-foreground p-3 text-sm ml-8'
                  }>
                  {message.content}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendQuestion();
                  }
                }}
                placeholder="Pergunte qualquer coisa sobre sua carteira..."
              />
              <Button onClick={sendQuestion} disabled={sending || !question.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      </PremiumBlur>
    </div>
  );
}
