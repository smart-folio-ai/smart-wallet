import React from 'react';
import {mockSubscriptionPlans} from '@/utils/mockData';
import {PlanCard} from '@/components/plans/PlanCard';
import {SeletorPrice} from '@/components/plans/SeletorPrice';
import {Calendar, CircleDollarSign, Star} from 'lucide-react';
import {toast} from 'sonner';
import {useNavigate} from 'react-router-dom';

type PricingPeriod = 'monthly' | 'annual';

interface IFeature {
  name: string;
  included: boolean;
}

export interface IPlanWithFeatures {
  _id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  badge?: string;
  comingSoon?: boolean;
  features: IFeature[];
  isActive: boolean;
}

export default function PublicPlans() {
  const navigate = useNavigate();
  const [pricingPeriod, setPricingPeriod] =
    React.useState<PricingPeriod>('monthly');
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});

  const plans = React.useMemo<IPlanWithFeatures[]>(() => {
    return mockSubscriptionPlans.map((plan) => {
      const planId = plan._id;
      const annualPrice = plan.price * 12 * 0.7;

      let features: IFeature[] = plan.features.map((name) => ({
        name,
        included: true,
      }));
      let badge: string | undefined = undefined;

      if (plan.name === 'Gratuito') {
        features = [
          ...features,
          {name: 'Sincronização automática com a B3', included: false},
          {name: 'Preço teto e suporte por ativo', included: false},
          {name: 'Insight de IA para ativos da B3', included: false},
          {name: 'Relatórios financeiros', included: false},
          {name: 'Análise de criptomoedas', included: false},
          {name: 'Alertas de Preço em Tempo Real', included: false},
          {name: 'Insight de IA para Investimento', included: false},
          {name: 'Insight de IA para crypto', included: false},
          {name: 'Acesso a market data', included: false},
        ];
      } else if (plan.name === 'Investidor Pro') {
        badge = 'Popular';
        features = [
          ...features,
          {name: 'Análise de criptomoedas', included: false},
          {name: 'Alertas de Preço em Tempo Real', included: false},
          {name: 'Insight de IA para Investimento', included: false},
          {name: 'Insight de IA para crypto', included: false},
          {name: 'Relatórios financeiros', included: false},
          {name: 'Acesso a market data', included: false},
        ];
      } else if (plan.name === 'Premium') {
        features = [
          {name: 'Todas as funcionalidades do plano Pro', included: true},
          ...features,
        ];
      }

      return {
        ...plan,
        _id: planId,
        monthlyPrice: plan.price,
        annualPrice,
        comingSoon: !plan.isActive,
        badge,
        features,
      };
    });
  }, []);

  const handleSubscribe = (planId: string) => {
    const plan = plans.find((p) => p._id === planId);
    if (!plan) {
      toast.error('Plano não encontrado');
      return;
    }

    if (!plan.isActive) {
      toast.info('Este plano estará disponível em breve!');
      return;
    }

    if (plan.name === 'Gratuito') {
      toast.info('Este é o plano gratuito. Crie uma conta para começar!');
      navigate('/register');
      return;
    }

    toast.info('Faça login para assinar este plano', {
      action: {
        label: 'Fazer Login',
        onClick: () => navigate('/'),
      },
    });
  };

  return (
    <>
      <div className="container py-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Invista melhor com o Trakker
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Escolha o plano ideal para suas necessidades de investimento
          </p>

          <SeletorPrice
            pricingPeriod={pricingPeriod}
            setPricingPeriod={setPricingPeriod}
            leftSeletorName="Mensal"
            rightSeletorName="Anual"
            badgeName="Economize 30%"
          />
        </div>
        <div className="container py-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans?.map((plan) => (
              <PlanCard
                features={plan.features}
                key={plan._id}
                plan={plan}
                pricingPeriod={pricingPeriod}
                loading={loading[plan._id]}
                onSubscribe={() => handleSubscribe(plan._id)}
              />
            ))}
          </div>
        </div>
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
              Devolução do valor integral em até 7 dias se não estiver
              satisfeito.
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
      </div>
    </>
  );
}
