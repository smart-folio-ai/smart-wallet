import React, {useEffect, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Check, Crown, ArrowRight, Download, Calendar} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {AppLogo} from '@/components/AppLogo';
import {toast} from 'sonner';

interface SubscriptionDetails {
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  nextBilling: string;
  features: string[];
}

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] =
    useState<SubscriptionDetails | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Simular busca dos detalhes da assinatura
    // Em produção, você faria uma chamada para verificar o session_id no Stripe
    setTimeout(() => {
      setSubscriptionDetails({
        planName: 'Investidor Pro',
        amount: 14.9,
        currency: 'BRL',
        interval: 'month',
        status: 'active',
        nextBilling: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        features: [
          'Sincronização automática com B3',
          'Insights de IA para ativos B3',
          'Preço teto e suporte por ativo',
          'Recomendações de compra/venda',
          'Relatórios avançados',
          'Suporte prioritário',
        ],
      });
      setLoading(false);
      toast.success('Assinatura ativada com sucesso!');
    }, 1500);
  }, [sessionId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-info/40 via-primary/30 to-secondary/50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-info/40 via-primary/30 to-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <AppLogo size="lg" />
        </div>

        <Card className="card-gradient border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-info/10 opacity-50 pointer-events-none" />

          <CardHeader className="relative text-center pb-4">
            <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-success mb-2">
              Assinatura Confirmada!
            </CardTitle>
            <CardDescription className="text-lg">
              Bem-vindo ao {subscriptionDetails?.planName}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* Detalhes da assinatura */}
            <div className="bg-card/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {subscriptionDetails?.planName}
                    </h3>
                    <p className="text-muted-foreground">
                      {formatCurrency(subscriptionDetails?.amount || 0)}/
                      {subscriptionDetails?.interval === 'month'
                        ? 'mês'
                        : 'ano'}
                    </p>
                  </div>
                </div>
                <Badge variant="default" className="bg-success/20 text-success">
                  {subscriptionDetails?.status === 'active'
                    ? 'Ativo'
                    : 'Pendente'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Próxima cobrança
                  </p>
                  <p className="text-lg font-semibold flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(subscriptionDetails?.nextBilling || '')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    ID da Sessão
                  </p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {sessionId?.slice(0, 20)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Recursos inclusos */}
            <div className="bg-card/50 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-4">
                Recursos inclusos na sua assinatura:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subscriptionDetails?.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-success rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos passos */}
            <div className="bg-primary/10 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-3">Próximos passos:</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="text-sm">
                    Conecte suas contas de investimento
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="text-sm">
                    Configure suas preferências de análise
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="text-sm">
                    Explore os insights de IA personalizados
                  </span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex-1 success-gradient border-0"
                size="lg">
                <ArrowRight className="h-4 w-4 mr-2" />
                Ir para Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/sync-accounts')}
                size="lg">
                Conectar Contas
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  // Simular download do recibo
                  toast.success('Recibo enviado por email!');
                }}>
                <Download className="h-4 w-4 mr-2" />
                Recibo
              </Button>
            </div>

            {/* Informações de contato */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Precisa de ajuda? Entre em contato conosco em{' '}
                <a
                  href="mailto:suporte@smartfolio.com"
                  className="text-primary hover:underline">
                  suporte@smartfolio.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
