import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, LineChart, Shield, Zap, Brain, Target, Check } from "lucide-react";
import { Link } from "react-router-dom";
import trakkerLogo from "@/assets/trakker-logo.png";
import { useState, useEffect } from "react";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
      {/* Fixed Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg border-b shadow-sm" : "bg-transparent"
      }`}>
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={trakkerLogo} alt="Trakker" className="h-12" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection("inicio")} className="text-foreground/80 hover:text-foreground transition-colors">
                Início
              </button>
              <button onClick={() => scrollToSection("sobre")} className="text-foreground/80 hover:text-foreground transition-colors">
                Sobre
              </button>
              <button onClick={() => scrollToSection("planos")} className="text-foreground/80 hover:text-foreground transition-colors">
                Planos
              </button>
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
        </div>
      </header>

      {/* Hero Content */}
      <section id="inicio" className="container mx-auto px-4 pt-32 pb-20 text-center">
        <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
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

        {/* Parallax Effect */}
        <div className="mt-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="relative rounded-lg border bg-card shadow-2xl overflow-hidden animate-scale-in">
            <div className="aspect-video relative">
              {/* Parallax Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-info/20 to-success/30" 
                   style={{ 
                     transform: `translateY(${typeof window !== 'undefined' ? window.scrollY * 0.3 : 0}px)`,
                     transition: 'transform 0.1s ease-out'
                   }}>
              </div>
              {/* Animated Grid */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
                  backgroundSize: '50px 50px',
                  animation: 'slide 20s linear infinite'
                }}>
                </div>
              </div>
              {/* Floating Icons */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <TrendingUp className="absolute top-1/4 left-1/4 w-16 h-16 text-primary/40 animate-[float_3s_ease-in-out_infinite]" />
                  <LineChart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-info/50" />
                  <Brain className="absolute bottom-1/4 right-1/4 w-16 h-16 text-success/40 animate-[float_3s_ease-in-out_infinite_0.5s]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="sobre" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 animate-fade-in">
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

      {/* Pricing Section */}
      <section id="planos" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">Escolha o Plano Ideal</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Planos flexíveis para todos os perfis de investidores
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="border-border hover:border-primary/40 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Básico</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">Grátis</span>
                </div>
                <p className="text-muted-foreground">Para começar a investir</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Até 10 ativos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Acompanhamento básico</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Gráficos simples</span>
                </li>
              </ul>
              <Link to="/register" className="block">
                <Button variant="outline" className="w-full">
                  Começar Grátis
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-primary shadow-lg hover:shadow-xl transition-all relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Mais Popular
              </span>
            </div>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">R$ 29</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-muted-foreground">Para investidores sérios</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Ativos ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>IA Insights avançados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Comparador de ativos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Alertas personalizados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Análise detalhada</span>
                </li>
              </ul>
              <Link to="/register" className="block">
                <Button className="w-full">
                  Assinar Premium
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-border hover:border-info/40 transition-all hover:shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <p className="text-muted-foreground">Para empresas</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Todos os recursos Premium</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>API dedicada</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Suporte prioritário</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  <span>Múltiplas contas</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Entrar em Contato
              </Button>
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
