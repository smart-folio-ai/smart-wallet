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
      className={`relative overflow-hidden flex flex-col h-full font-sans transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
        plan.badge 
          ? 'bg-gradient-to-br from-primary/10 via-card to-card border-[2px] border-primary shadow-[0_0_40px_-15px_rgba(38,101,253,0.5)]' 
          : 'bg-card border border-border/40 hover:border-primary/40'
      }`}>
      {plan.comingSoon ? (
        <div className="absolute top-4 right-4 z-30 transform rotate-2">
          <Badge className="bg-gradient-to-r from-amber-400 to-orange-600 text-white font-bold uppercase tracking-wider py-1 px-3 shadow-lg border-0">
            Chegando em breve
          </Badge>
        </div>
      ) : null}

      <div
        className={
          plan.comingSoon ? 'pointer-events-none blur-[3px] opacity-50 transition-all' : ''
        }>
        <CardHeader className="pb-4 relative">
          {plan.badge && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-bl-[100px] -z-10 pointer-events-none" />
          )}
          {plan.badge && (
            <Badge className="w-fit mb-3 bg-primary text-primary-foreground font-semibold shadow-md border-0 uppercase tracking-widest px-3" variant="default">
              {plan.badge}
            </Badge>
          )}
          <CardTitle className="text-2xl font-heading font-bold tracking-tight text-foreground">{plan.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow pt-0 pb-6">
          <div className="flex items-baseline mb-6 border-b border-border/50 pb-6">
            {!plan.comingSoon && plan.price !== null ? (
              <>
                <span className="text-4xl font-heading font-extrabold tracking-tight text-foreground">
                  R${' '}
                  {pricingPeriod === 'monthly'
                    ? plan.monthlyPrice.toFixed(2).replace('.', ',')
                    : plan.annualPrice.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-sm font-medium text-muted-foreground ml-2">
                  {pricingPeriod === 'monthly' ? '/mês' : '/ano'}
                </span>
              </>
            ) : (
              <span className="text-3xl font-heading font-bold text-primary">Baixo Custo</span>
            )}
          </div>

          <div className="space-y-3.5">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start text-sm">
                {feature.included ? (
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-muted-foreground/50 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <span
                  className={`leading-tight ${feature.included ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
      <CardFooter className="pt-2 pb-6">
        {isCurrentPlan ? (
          <Button
            onClick={onManagePlan}
            className="w-full h-11 font-semibold border-primary text-primary hover:bg-primary/10"
            variant="outline"
            disabled={isManagingPlan}>
            {isManagingPlan ? 'Carregando Portal...' : 'Gerenciar Plano'}
          </Button>
        ) : (
          <Button
            onClick={onSubscribe}
            className={`w-full h-11 font-semibold transition-all ${plan.badge ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md' : ''}`}
            variant={plan.badge ? 'default' : 'outline'}
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
        <div className="absolute inset-0 bg-background/40 pointer-events-none" />
      ) : null}
    </Card>
  );
};

