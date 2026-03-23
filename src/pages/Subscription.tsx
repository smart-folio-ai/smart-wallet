import React, {useMemo} from 'react';
import {toast} from 'sonner';
import SubscriptionService from '@/services/subscription';
import {useQuery} from '@tanstack/react-query';
import {IUserProfileResponse} from '@/interface/users';
import Profile from '@/services/profile';
import {PlanCard} from '@/components/plans/PlanCard';
import {
  CurrentSubscriptionResponse,
  ISubscription,
} from '@/interface/subscription';
import {Calendar, CircleDollarSign, Star} from 'lucide-react';
import {configUrlStripePaymentSuccessOrCancel, styleToast} from '@/utils';
import {SeletorPrice} from '@/components/plans/SeletorPrice';
import {cancelUrl, successUrl} from '@/utils/env';

type PricingPeriod = 'monthly' | 'annual';

interface IFeature {
  name: string;
  included: boolean;
}

export interface IPlanWithFeatures extends Omit<ISubscription, 'features'> {
  monthlyPrice: number;
  annualPrice: number;
  badge?: string;
  comingSoon?: boolean;
  features: IFeature[];
}

export default function Subscriptions() {
  const successCheckoutUrl = configUrlStripePaymentSuccessOrCancel(successUrl);
  const cancelCheckoutUrl = configUrlStripePaymentSuccessOrCancel(cancelUrl);
  const [pricingPeriod, setPricingPeriod] =
    React.useState<PricingPeriod>('monthly');
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});

  const fetchProfileUser = async () => {
    const userProfile: IUserProfileResponse = await Profile.getProfile();
    return userProfile;
  };

  const fetchGetCurrentUser = async () => {
    const getUserId = await fetchProfileUser();
    return getUserId;
  };

  const fetchGetPlans = async () => {
    const plans = await SubscriptionService.getPlans();
    return plans;
  };

  const createCheckout = async (planId: string) => {
    try {
      const user = await fetchGetCurrentUser();
      const createCheckout = await SubscriptionService.createCheckoutSession(
        planId,
        user._id,
        successCheckoutUrl,
        cancelCheckoutUrl,
      );
      return createCheckout;
    } catch (error) {
      throw new Error(
        'Serviço de pagamento não disponível. Configure o backend para processar pagamentos.',
      );
    }
  };

  const fetchCurrentSubscription = async () => {
    return SubscriptionService.getCurrentPlan();
  };

  const {data: currentSubscription} = useQuery<CurrentSubscriptionResponse>({
    queryKey: ['current-subscription'],
    queryFn: fetchCurrentSubscription,
  });

  const currentPlanId = currentSubscription?.plan?._id || null;

  const {data: rawPlans, isLoading} = useQuery<ISubscription[]>({
    queryKey: ['plans'],
    queryFn: fetchGetPlans,
  });

  const plans = React.useMemo<IPlanWithFeatures[]>(() => {
    if (!rawPlans) return [];

    return rawPlans.map((plan) => {
      const planId = plan._id;
      const annualPrice = plan.price * 12 * 0.7;
      const normalizedName = plan.name.toLowerCase().replace(/\s+/g, '');
      const isGlobalInvestor =
        normalizedName.includes('globalinvestor') ||
        normalizedName.includes('investidorglobal');

      return {
        ...plan,
        id: planId,
        monthlyPrice: plan.price,
        annualPrice,
        comingSoon: isGlobalInvestor,
        badge: plan.name === 'Investidor Pro' ? 'Popular' : undefined,
        features: plan.features.map((name) => ({
          name,
          included: true,
        })),
      };
    });
  }, [rawPlans]);

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find((p) => p._id === planId);
    if (!plan) {
      toast.error('Plano não encontrado');
      return;
    }

    if (plan.comingSoon) {
      toast.info('Plano GlobalInvestor em breve.');
      return;
    }

    if (!plan.isActive) {
      toast.info('Este plano estará disponível em breve!');
      return;
    }

    try {
      toast.success('Redirecionando para o checkout...', {
        style: styleToast().success,
      });
      setLoading((prev) => ({...prev, [plan._id]: true}));
      const session = await createCheckout(plan._id);
      window.location.href = session.url; // Redireciona pro checkout
    } catch (err: unknown) {
      let errorMessage = 'Erro ao iniciar o checkout';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage, {
        style: styleToast().error,
      });
    } finally {
      setLoading((prev) => ({...prev, [plan._id]: false}));
    }
  };

  const handleManagePlan = async () => {
    try {
      setLoading((prev) => ({...prev, portal: true}));
      const user = await fetchGetCurrentUser();
      const session = await SubscriptionService.createPortalSession(
        user._id,
        window.location.href, // Return URL
      );
      window.location.href = session.url;
    } catch (err: unknown) {
      toast.error('Erro ao acessar o portal de assinaturas', {
        style: styleToast().error,
      });
    } finally {
      setLoading((prev) => ({...prev, portal: false}));
    }
  };

  return (
    <>
      <div className="container py-12 font-sans selection:bg-primary/20">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-foreground">
            Invista melhor com o Trackerr
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground pb-4 max-w-2xl mx-auto leading-relaxed">
            Escolha o plano ideal para suas necessidades de investimento e
            destrave o poder da Inteligência Artificial.
          </p>

          <SeletorPrice
            pricingPeriod={pricingPeriod}
            setPricingPeriod={setPricingPeriod}
            leftSeletorName="Mensal"
            rightSeletorName="Anual"
            badgeName="Economize 30%"
          />
        </div>
        <div className="container px-0 md:px-4 pb-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {isLoading ? (
              <div>Carregando planos...</div>
            ) : (
              plans?.map((plan) => (
                <PlanCard
                  features={plan.features}
                  key={plan._id}
                  plan={plan}
                  pricingPeriod={pricingPeriod}
                  loading={loading[plan._id]}
                  onSubscribe={() => handleSubscribe(plan._id)}
                  isCurrentPlan={currentPlanId === plan._id}
                  onManagePlan={handleManagePlan}
                  isManagingPlan={loading['portal']}
                />
              ))
            )}
          </div>
        </div>
        {/* Seção de informações adicionais */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 pb-10 max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <CircleDollarSign className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
              Cancelamento a qualquer momento
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você pode cancelar sua assinatura quando quiser, de forma simples
              e sem custos adicionais.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Star className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
              Satisfação garantida
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Devolução do valor integral em até 7 dias da compra caso você não
              se adapte.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
              <Calendar className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
              Suporte dedicado
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Nossa equipe técnica e de especialistas está sempre pronta para
              ajudar.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
