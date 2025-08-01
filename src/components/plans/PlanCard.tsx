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
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  pricingPeriod,
  loading,
  onSubscribe,
}) => {
  return (
    <Card
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
          {plan.price !== null ? (
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
      <CardFooter>
        <Button
          onClick={onSubscribe}
          className="w-full"
          variant={
            plan.name === 'Gratuito' || plan.comingSoon ? 'outline' : 'default'
          }
          disabled={loading || plan.name === 'Gratuito'}>
          {loading
            ? 'Processando...'
            : plan.name === 'Gratuito'
            ? 'Plano Atual'
            : plan.comingSoon
            ? 'Notifique-me'
            : 'Assinar Agora'}
        </Button>
      </CardFooter>
    </Card>
  );
};
