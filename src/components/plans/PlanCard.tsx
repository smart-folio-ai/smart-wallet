import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Check, X} from 'lucide-react';
import {IPlanWithFeatures} from '@/pages/Subscription';

interface IFeature {
  name: string;
  included: boolean;
}

interface PlanCardProps {
  features: IFeature[];
  plan: IPlanWithFeatures;
  pricingPeriod: 'monthly' | 'annual';
  loading: boolean;
  onSubscribe: () => void;
  isCurrentPlan: boolean;
  onManagePlan?: () => void;
  isManagingPlan?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  pricingPeriod,
  loading,
  onSubscribe,
  isCurrentPlan,
  onManagePlan,
  isManagingPlan,
}) => {
  return (
    <Card
      className={`relative overflow-hidden flex flex-col h-full border-2 ${
        plan.badge ? 'border-primary' : 'border-border'
      }`}>
      {plan.comingSoon ? (
        <div className="absolute top-3 right-3 z-20">
          <Badge variant="secondary">Em breve</Badge>
        </div>
      ) : null}

      <div className={plan.comingSoon ? 'pointer-events-none blur-[1.5px] opacity-75' : ''}>
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
          {!plan.comingSoon && plan.price !== null ? (
            <>
              <span className="text-3xl font-bold">
                R${' '}
                {pricingPeriod === 'monthly'
                  ? plan.monthlyPrice.toFixed(2).replace('.', ',')
                  : plan.annualPrice.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-muted-foreground ml-2">
                {pricingPeriod === 'monthly' ? '/mês' : '/ano'}
              </span>
            </>
          ) : (
            <span className="text-3xl font-bold text-primary">Em breve</span>
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
              <span className={feature.included ? '' : 'text-muted-foreground'}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>
        </CardContent>
      </div>
      <CardFooter>
        {isCurrentPlan ? (
          <Button
            onClick={onManagePlan}
            className="w-full"
            variant="outline"
            disabled={isManagingPlan}>
            {isManagingPlan ? 'Carregando Portal...' : 'Gerenciar Plano'}
          </Button>
        ) : (
          <Button
            onClick={onSubscribe}
            className="w-full"
            variant="default"
            disabled={loading || isCurrentPlan || plan.comingSoon}>
            {loading
              ? 'Processando...'
              : plan.comingSoon
                ? 'Em breve'
                : 'Assinar Agora'}
          </Button>
        )}
      </CardFooter>
      {plan.comingSoon ? (
        <div className="absolute inset-0 bg-background/20 pointer-events-none" />
      ) : null}
    </Card>
  );
};
