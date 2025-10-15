import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, LineChart, Shield, Zap, Brain, Target } from "lucide-react";
import { Link } from "react-router-dom";
import trakkerLogo from "@/assets/trakker-logo.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={trakkerLogo} alt="Trakker" className="h-10" />
          </div>
          <div className="flex items-center gap-4">
            <Link to="/signin">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button>Começar Agora</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Carteira Inteligente de
            <span className="block text-primary mt-2">Investimentos</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gerencie e analise seus investimentos com inteligência artificial.
            Tomada de decisão baseada em dados, análise em tempo real e insights personalizados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8">
                Experimente Grátis
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Ver Demonstração
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="rounded-lg border bg-card shadow-2xl overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary/20 to-info/20 flex items-center justify-center">
              <LineChart className="w-32 h-32 text-primary/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Inovação em Gestão de Investimentos</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trakker combina tecnologia de ponta com análise financeira avançada
            para oferecer uma experiência única de gestão de portfólio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">IA Insights</h3>
              <p className="text-muted-foreground">
                Análise inteligente do seu portfólio com recomendações personalizadas
                baseadas em machine learning e dados do mercado.
              </p>
            </CardContent>
          </Card>

          <Card className="border-info/20 hover:border-info/40 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-info/10 w-12 h-12 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-info" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Análise em Tempo Real</h3>
              <p className="text-muted-foreground">
                Acompanhe a performance dos seus ativos em tempo real com
                gráficos interativos e métricas detalhadas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-success/20 hover:border-success/40 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-success/10 w-12 h-12 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Comparador de Ativos</h3>
              <p className="text-muted-foreground">
                Compare múltiplos ativos lado a lado com análise de P/L, dividendos
                e indicadores fundamentalistas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-warning/20 hover:border-warning/40 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-warning/10 w-12 h-12 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Segurança Total</h3>
              <p className="text-muted-foreground">
                Seus dados protegidos com criptografia de ponta a ponta e
                autenticação de dois fatores.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sincronização Automática</h3>
              <p className="text-muted-foreground">
                Conecte suas contas de investimento e mantenha tudo
                sincronizado automaticamente.
              </p>
            </CardContent>
          </Card>

          <Card className="border-info/20 hover:border-info/40 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-info/10 w-12 h-12 flex items-center justify-center mb-4">
                <LineChart className="w-6 h-6 text-info" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Planejamento Financeiro</h3>
              <p className="text-muted-foreground">
                Defina metas e acompanhe seu progresso com ferramentas
                de planejamento estratégico.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-info/5">
          <CardContent className="py-16 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Pronto para Revolucionar seus Investimentos?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de investidores que já utilizam Trakker
              para maximizar seus retornos.
            </p>
            <Link to="/register">
              <Button size="lg" className="text-lg px-12">
                Começar Gratuitamente
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={trakkerLogo} alt="Trakker" className="h-8" />
              <span className="text-sm text-muted-foreground">
                © 2025 Trakker. Todos os direitos reservados.
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
