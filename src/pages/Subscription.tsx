
import React from "react";
import { 
  Check, 
  X, 
  CircleDollarSign, 
  Star, 
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscriptionService } from "@/lib/api";
import { toast } from "sonner";

type PricingPeriod = "monthly" | "annual";

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  badge?: string;
  features: PlanFeature[];
}

const plans: PricingPlan[] = [
  {
    id: "free",
    name: "Gratuito",
    description: "Para investidores iniciantes",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { name: "Dashboard de carteira", included: true },
      { name: "Sincronização B3 (manual)", included: true },
      { name: "Relatórios básicos", included: true },
      { name: "Insights de IA", included: false },
      { name: "Análise de criptomoedas", included: false },
      { name: "Recomendações personalizadas", included: false },
    ],
  },
  {
    id: "pro",
    name: "Investidor Pro",
    description: "Para investidores focados em B3",
    monthlyPrice: 14.90,
    annualPrice: 14.90 * 12,
    badge: "Popular",
    features: [
      { name: "Todas as funcionalidades do plano Gratuito", included: true },
      { name: "Sincronização automática com B3", included: true },
      { name: "Insights de IA para ativos B3", included: true },
      { name: "Preço teto e suporte por ativo", included: true },
      { name: "Recomendações de compra/venda", included: true },
      { name: "Análise de criptomoedas", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Para investidores diversificados",
    monthlyPrice: 24.90,
    annualPrice: 24.90 * 12,
    features: [
      { name: "Todas as funcionalidades do plano Pro", included: true },
      { name: "Sincronização com exchanges de criptomoedas", included: true },
      { name: "Insights de IA para criptomoedas", included: true },
      { name: "Alertas de preço em tempo real", included: true },
      { name: "Recomendações de portfólio completo", included: true },
      { name: "Prioridade no suporte", included: true },
    ],
  },
];

export default function Subscription() {
  const [pricingPeriod, setPricingPeriod] = React.useState<PricingPeriod>("monthly");
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") {
      toast.success("Você já está no plano gratuito!");
      return;
    }

    setLoading({ ...loading, [planId]: true });
    try {
      // Em um ambiente real, isso chamaria a API para iniciar o processo de checkout
      await subscriptionService.upgradePlan(planId);
      toast.success("Redirecionando para o checkout...");
    } catch (error) {
      console.error("Erro ao iniciar assinatura:", error);
      toast.error("Não foi possível iniciar o processo de assinatura. Tente novamente mais tarde.");
    } finally {
      setLoading({ ...loading, [planId]: false });
    }
  };

  return (
    <div className="container py-10">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Invista melhor com o SmartFolio</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Escolha o plano ideal para suas necessidades de investimento
        </p>

        <div className="flex items-center justify-center bg-muted p-1 rounded-lg w-fit mx-auto mb-8">
          <Button
            variant={pricingPeriod === "monthly" ? "default" : "ghost"}
            className="rounded-lg"
            onClick={() => setPricingPeriod("monthly")}
          >
            Mensal
          </Button>
          <Button
            variant={pricingPeriod === "annual" ? "default" : "ghost"}
            className="rounded-lg"
            onClick={() => setPricingPeriod("annual")}
          >
            <span>Anual</span>
            <Badge
              variant="outline"
              className="ml-2 bg-primary/20 text-primary-foreground border-none"
            >
              Economize 20%
            </Badge>
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col h-full border-2 ${
              plan.badge ? 'border-primary' : 'border-border'
            }`}
          >
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
                <span className="text-4xl font-bold">
                  R$ {pricingPeriod === "monthly" 
                    ? plan.monthlyPrice.toFixed(2).replace('.', ',') 
                    : (plan.annualPrice * 0.8).toFixed(2).replace('.', ',')}
                </span>
                <span className="text-muted-foreground ml-2">
                  {pricingPeriod === "monthly" ? "/mês" : "/ano"}
                </span>
              </div>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground"}>
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
                variant={plan.id === "free" ? "outline" : "default"}
                disabled={loading[plan.id]}
              >
                {loading[plan.id] ? (
                  "Processando..."
                ) : plan.id === "free" ? (
                  "Plano Atual"
                ) : (
                  "Assinar Agora"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <CircleDollarSign className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Cancelamento a qualquer momento</h3>
          <p className="text-muted-foreground">
            Você pode cancelar sua assinatura quando quiser, sem custos adicionais.
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
            Nosso time de especialistas está pronto para ajudar você em sua jornada.
          </p>
        </div>
      </div>
    </div>
  );
}
