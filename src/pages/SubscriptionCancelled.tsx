import React from 'react';
import {useNavigate} from 'react-router-dom';
import {
  X,
  ArrowLeft,
  MessageCircle,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {AppLogo} from '@/components/AppLogo';

export default function SubscriptionCancelled() {
  const navigate = useNavigate();

  const reasons = [
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: 'Problema com pagamento',
      description: 'Verifique se seus dados de pagamento estão corretos',
      action: () => navigate('/subscription'),
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      title: 'Precisa de mais informações',
      description: 'Conheça melhor nossos recursos e benefícios',
      action: () => navigate('/ai-insights'),
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: 'Falar com suporte',
      description: 'Nossa equipe pode esclarecer suas dúvidas',
      action: () => window.open('mailto:suporte@trackerr.com'),
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <AppLogo size="lg" />
        </div>

        <Card className="rounded-2xl bg-card border border-border/60 shadow-2xl shadow-primary/5 overflow-hidden">
          <CardHeader className="relative text-center pb-6 pt-8">
            <div className="w-16 h-16 bg-muted/50 border border-border/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold font-heading text-foreground mb-2">
              Assinatura Cancelada
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Não se preocupe, você ainda pode assinar quando quiser
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* Mensagem principal */}
            <div className="text-center bg-muted/30 border border-border/40 rounded-xl p-6">
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">O que aconteceu?</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Sua assinatura foi cancelada e nenhuma cobrança foi realizada.
                Você pode tentar novamente a qualquer momento.
              </p>
              <p className="text-sm text-muted-foreground">
                Seus dados estão seguros e você continua com acesso ao plano
                gratuito.
              </p>
            </div>

            {/* Possíveis razões e soluções */}
            <div className="space-y-4">
              <h4 className="text-lg font-heading font-semibold text-center text-foreground">
                Como podemos ajudar?
              </h4>
              <div className="grid gap-4">
                {reasons.map((reason, index) => (
                  <Card
                    key={index}
                    className="bg-card border border-border/50 hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
                    onClick={reason.action}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          {reason.icon}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-heading font-medium text-foreground">{reason.title}</h5>
                          <p className="text-sm text-muted-foreground">
                            {reason.description}
                          </p>
                        </div>
                        <ArrowLeft className="h-5 w-5 text-muted-foreground/50 rotate-180" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Benefícios que está perdendo */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
              <h4 className="text-lg font-heading font-semibold mb-4 text-center text-yellow-600 dark:text-yellow-500">
                Recursos que você teria com o plano Premium:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Sincronização automática com B3',
                  'Insights de IA personalizados',
                  'Recomendações de compra/venda',
                  'Análise de preço justo',
                  'Alertas de oportunidades',
                  'Suporte prioritário',
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => navigate('/subscription')}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-0 h-12"
                size="lg">
                Tentar Novamente
              </Button>
              <Button
                variant="outline"
                className="h-12"
                onClick={() => navigate('/dashboard')}
                size="lg">
                Continuar Gratuito
              </Button>
            </div>

            {/* Oferta especial */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 text-center">
              <h4 className="text-lg font-heading font-semibold text-primary mb-2">Oferta Especial</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Que tal experimentar nosso plano gratuito por mais tempo? Você
                pode sempre fazer upgrade quando se sentir pronto.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/ai-insights')}
                className="bg-background/80 hover:bg-primary hover:text-primary-foreground border-primary/20 transition-all font-medium">
                Explorar Recursos Gratuitos
              </Button>
            </div>

            {/* Informações de contato */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Ainda tem dúvidas? Fale conosco em{' '}
                <a
                  href="mailto:suporte@trackerr.com"
                  className="text-primary hover:underline">
                  suporte@trackerr.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
