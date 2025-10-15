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
      action: () => window.open('mailto:suporte@trakker.com'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-info/40 via-primary/30 to-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <AppLogo size="lg" />
        </div>

        <Card className="card-gradient border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-info/10 opacity-50 pointer-events-none" />

          <CardHeader className="relative text-center pb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">
              Assinatura Cancelada
            </CardTitle>
            <CardDescription className="text-lg">
              Não se preocupe, você ainda pode assinar quando quiser
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* Mensagem principal */}
            <div className="text-center bg-card/50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-3">O que aconteceu?</h3>
              <p className="text-muted-foreground mb-4">
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
              <h4 className="text-lg font-semibold text-center">
                Como podemos ajudar?
              </h4>
              <div className="grid gap-4">
                {reasons.map((reason, index) => (
                  <Card
                    key={index}
                    className="bg-card/50 hover:bg-card/70 cursor-pointer transition-colors"
                    onClick={reason.action}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                          {reason.icon}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium">{reason.title}</h5>
                          <p className="text-sm text-muted-foreground">
                            {reason.description}
                          </p>
                        </div>
                        <ArrowLeft className="h-5 w-5 text-muted-foreground rotate-180" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Benefícios que está perdendo */}
            <div className="bg-warning/10 rounded-lg p-6">
              <h4 className="text-lg font-semibold mb-3 text-center">
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
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/subscription')}
                className="flex-1 success-gradient border-0"
                size="lg">
                Tentar Novamente
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                size="lg">
                Continuar Gratuito
              </Button>
            </div>

            {/* Oferta especial */}
            <div className="bg-gradient-to-r from-primary/20 to-info/20 rounded-lg p-6 text-center">
              <h4 className="text-lg font-semibold mb-2">Oferta Especial</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Que tal experimentar nosso plano gratuito por mais tempo? Você
                pode sempre fazer upgrade quando se sentir pronto.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/ai-insights')}
                className="bg-background/50">
                Explorar Recursos Gratuitos
              </Button>
            </div>

            {/* Informações de contato */}
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Ainda tem dúvidas? Fale conosco em{' '}
                <a
                  href="mailto:suporte@trakker.com"
                  className="text-primary hover:underline">
                  suporte@trakker.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
