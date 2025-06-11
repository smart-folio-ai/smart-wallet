import React from 'react';
import {Check, X, CircleDollarSign, Star, Calendar} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {subscriptionService} from '@/lib/api';
import {toast} from 'sonner';
import stripe from '@/services/payment/stripe';

type PricingPeriod = 'monthly' | 'annual';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  stripePriceId?: string; // ID do preço no Stripe
  badge?: string;
  features: PlanFeature[];
  comingSoon?: boolean;
}

const plans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Para investidores iniciantes',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      {name: 'Dashboard de carteira', included: true},
      {name: 'Sincronização B3 (manual)', included: true},
      {name: 'Relatórios básicos', included: true},
      {name: 'Insights de IA', included: false},
      {name: 'Análise de criptomoedas', included: false},
      {name: 'Recomendações personalizadas', included: false},
    ],
  },
  {
    id: 'pro',
    name: 'Investidor Pro',
    description: 'Para investidores focados em B3',
    monthlyPrice: 14.9,
    annualPrice: 14.9 * 12,
    stripePriceId: 'prod_STE8PhGBvpxVk8', // Substitua pelo ID real do Stripe
    badge: 'Popular',
    features: [
      {name: 'Todas as funcionalidades do plano Gratuito', included: true},
      {name: 'Sincronização automática com B3', included: true},
      {name: 'Insights de IA para ativos B3', included: true},
      {name: 'Preço teto e suporte por ativo', included: true},
      {name: 'Recomendações de compra/venda', included: true},
      {name: 'Análise de criptomoedas', included: false},
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Para investidores diversificados',
    monthlyPrice: 24.9,
    annualPrice: 24.9 * 12,
    stripePriceId: 'prod_STE7fuAobkPrxH', // Substitua pelo ID real do Stripe
    features: [
      {name: 'Todas as funcionalidades do plano Pro', included: true},
      {name: 'Sincronização com exchanges de criptomoedas', included: true},
      {name: 'Insights de IA para criptomoedas', included: true},
      {name: 'Alertas de preço em tempo real', included: true},
      {name: 'Recomendações de portfólio completo', included: true},
      {name: 'Prioridade no suporte', included: true},
    ],
  },
  {
    id: 'global',
    name: 'Global Investor',
    description: 'Para investidores internacionais',
    monthlyPrice: null,
    annualPrice: null,
    badge: 'Em breve',
    comingSoon: true,
    features: [
      {name: 'Todas as funcionalidades do plano Premium', included: true},
      {name: 'Sincronização com corretoras internacionais', included: true},
      {name: 'Insights de IA para mercados globais', included: true},
      {name: 'Comparação entre mercados', included: true},
      {name: 'Análise de correlação global', included: true},
      {name: 'Suporte prioritário 24/7', included: true},
    ],
  },
];

export default function Subscription() {
  const [pricingPeriod, setPricingPeriod] =
    React.useState<PricingPeriod>('monthly');
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});

  // Função para iniciar checkout do Stripe
  const handleStripeCheckout = async (plan: PricingPlan) => {
    if (!plan.stripePriceId) {
      toast.error('ID do preço do Stripe não configurado para este plano');
      return;
    }

    setLoading({...loading, [plan.id]: true});

    try {
      console.log('Iniciando checkout para o plano:', plan.name);
      console.log('Price ID:', plan.stripePriceId);

      // TODO: Implementar chamada para Supabase Edge Function
      // Esta função deve:
      // 1. Verificar se o usuário está autenticado
      // 2. Criar sessão de checkout no Stripe
      // 3. Retornar URL para redirecionamento

      /*
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: plan.stripePriceId,
          planId: plan.id,
          period: pricingPeriod
        }
      });

      if (error) throw error;

      // Redirecionar para checkout do Stripe
      if (data.url) {
        window.location.href = data.url;
      }
      */

      // Por enquanto, apenas simular o processo
      toast.success(`Redirecionando para checkout do plano ${plan.name}...`);

      // Simular redirecionamento após 2 segundos
      setTimeout(() => {
        toast.info('Checkout simulado - integração com Stripe pendente');
      }, 2000);
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
      toast.error(
        'Não foi possível iniciar o processo de pagamento. Tente novamente.'
      );
    } finally {
      setLoading({...loading, [plan.id]: false});
    }
  };

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);

    if (!plan) {
      toast.error('Plano não encontrado');
      return;
    }

    if (planId === 'free') {
      toast.success('Você já está no plano gratuito!');
      return;
    }

    if (planId === 'global') {
      toast.info(
        'Este plano estará disponível em breve. Fique atento às novidades!'
      );
      return;
    }

    // Iniciar processo de checkout do Stripe
    await handleStripeCheckout(plan);
  };

  return (
    <div className="container py-10">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Invista melhor com o SmartFolio
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Escolha o plano ideal para suas necessidades de investimento
        </p>

        <div className="flex items-center justify-center bg-muted p-1 rounded-lg w-fit mx-auto mb-8">
          <Button
            variant={pricingPeriod === 'monthly' ? 'default' : 'ghost'}
            className="rounded-lg"
            onClick={() => setPricingPeriod('monthly')}>
            Mensal
          </Button>
          <Button
            variant={pricingPeriod === 'annual' ? 'default' : 'ghost'}
            className="rounded-lg"
            onClick={() => setPricingPeriod('annual')}>
            <span>Anual</span>
            <Badge
              variant="outline"
              className="ml-2 bg-primary/20 text-primary-foreground border-none">
              Economize 20%
            </Badge>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col h-full border-2 ${
              plan.badge ? 'border-primary' : 'border-border'
            }`}>
            <CardHeader>
              {plan.badge && (
                <Badge className="w-fit mb-2" variant="default">
                  {plan.badge}
                </Badge>
              )}
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-baseline mb-6">
                {plan.monthlyPrice !== null ? (
                  <>
                    <span className="text-4xl font-bold">
                      R${' '}
                      {pricingPeriod === 'monthly'
                        ? plan.monthlyPrice.toFixed(2).replace('.', ',')
                        : ((plan.annualPrice || 0) * 0.8)
                            .toFixed(2)
                            .replace('.', ',')}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {pricingPeriod === 'monthly' ? '/mês' : '/ano'}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    Em breve
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                    )}
                    <span
                      className={
                        feature.included ? '' : 'text-muted-foreground'
                      }>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSubscribe(plan.id)}
                className="w-full"
                variant={
                  plan.id === 'free' || plan.comingSoon ? 'outline' : 'default'
                }
                disabled={loading[plan.id]}>
                {loading[plan.id]
                  ? 'Processando...'
                  : plan.id === 'free'
                  ? 'Plano Atual'
                  : plan.comingSoon
                  ? 'Notifique-me'
                  : 'Assinar Agora'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Seção de informações adicionais */}
      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CircleDollarSign className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Cancelamento a qualquer momento
          </h3>
          <p className="text-muted-foreground">
            Você pode cancelar sua assinatura quando quiser, sem custos
            adicionais.
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Satisfação garantida</h3>
          <p className="text-muted-foreground">
            Devolução do valor integral em até 7 dias se não estiver satisfeito.
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Suporte dedicado</h3>
          <p className="text-muted-foreground">
            Nosso time de especialistas está pronto para ajudar você em sua
            jornada.
          </p>
        </div>
      </div>

      {/* Seção de instruções para configuração do Stripe */}
      <div className="mt-16 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-4">
          📋 Configuração do Stripe
        </h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">
              1. Configure os Price IDs do Stripe:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>
                Substitua{' '}
                <code className="bg-background px-1 rounded">
                  price_1234567890
                </code>{' '}
                pelo Price ID real do plano Pro
              </li>
              <li>
                Substitua{' '}
                <code className="bg-background px-1 rounded">
                  price_0987654321
                </code>{' '}
                pelo Price ID real do plano Premium
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">
              2. Implemente a Edge Function 'create-checkout':
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Crie uma Supabase Edge Function para processar checkouts</li>
              <li>Configure as chaves secretas do Stripe no Supabase</li>
              <li>
                Descomente e ajuste o código na função{' '}
                <code className="bg-background px-1 rounded">
                  handleStripeCheckout
                </code>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Configure URLs de retorno:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Defina as páginas de sucesso e cancelamento</li>
              <li>Configure webhooks para atualizar status de assinatura</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
