import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {
  TrendingUp,
  LineChart,
  Shield,
  Zap,
  Brain,
  Target,
  Check,
  ChevronRight,
  ArrowRight,
  Building,
  Mail,
  Linkedin,
  Twitter,
} from 'lucide-react';
import {Link} from 'react-router-dom';
import trakkerLogo from '@/assets/logo.png';
import {useState, useEffect} from 'react';

const TypingEffect = ({text, speed = 60}: {text: string; speed?: number}) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <>{displayedText}</>;
};

const CountUp = ({
  end,
  decimals = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
}: {
  end: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(progress * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);
  return <>{prefix}{count.toFixed(decimals)}{suffix}</>;
};

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Configura o title longo e meta tags
    document.title = "Trackerr | O Terminal Institucional do Investidor";
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({behavior: 'smooth'});
  };

  return (
    <div className="min-h-screen text-slate-900 bg-white" style={{fontFamily: 'var(--font-body)'}}>
      {/* Header Fixo */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm'
            : 'bg-transparent'
        }`}>
        <div className="container mx-auto px-6 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={trakkerLogo} alt="Trackerr" className="h-10" />
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <button onClick={() => scrollToSection('inicio')} className="hover:text-[var(--auth-brand)] transition-colors">Início</button>
              <button onClick={() => scrollToSection('features')} className="hover:text-[var(--auth-brand)] transition-colors">Recursos</button>
              <button onClick={() => scrollToSection('planos')} className="hover:text-[var(--auth-brand)] transition-colors">Planos</button>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/signin">
                <Button variant="ghost" className="font-semibold text-slate-700 hover:text-[var(--auth-brand)]">Entrar</Button>
              </Link>
              <Link to="/register">
                <Button className="font-bold shadow-md shadow-blue-500/20 rounded-full px-6" style={{background: 'linear-gradient(135deg, var(--auth-brand), var(--auth-brand-strong))', color: '#fff'}}>Começar Agora</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section Premium com Identidade da Tela de Login */}
      <section id="inicio" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" style={{backgroundColor: 'var(--auth-panel)', color: 'white'}}>
        {/* Glows Decorativos */}
        <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
             style={{background: 'radial-gradient(circle, var(--auth-highlight-soft) 0%, transparent 70%)'}} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
             style={{background: 'radial-gradient(circle, var(--auth-highlight-subtle) 0%, transparent 70%)'}} />

        <div className="container mx-auto px-6 relative z-10 text-center lg:text-left flex flex-col lg:flex-row items-center">
          
          {/* Texto Principal */}
          <div className="lg:w-1/2 lg:pr-12">
            <div className="mb-6 inline-flex">
              <span className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
                    style={{color: 'var(--auth-text-accent)', backgroundColor: 'var(--auth-highlight)', letterSpacing: '0.12em'}}>
                O Seu Novo Terminal Financeiro
              </span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6" style={{fontFamily: 'var(--font-heading)', color: 'var(--auth-text-main)', letterSpacing: '-0.02em'}}>
               <TypingEffect text="Precisão institucional para o seu patrimônio." speed={40} />
            </h1>
            <p className="text-lg lg:text-xl mb-10 leading-relaxed text-slate-300 max-w-2xl mx-auto lg:mx-0">
               Eleve seu gerenciamento de portfólio. Trackerr utiliza inteligência artificial para ler releases do RI, calcular métricas avançadas e ajudar você a superar o mercado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register">
                <Button size="lg" className="h-14 px-8 text-base font-bold shadow-lg shadow-blue-500/20 rounded-full w-full sm:w-auto" style={{background: 'linear-gradient(135deg, var(--auth-brand), var(--auth-brand-strong))', color: '#fff'}}>
                  Abrir Conta Gratuita <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            {/* Social Proof */}
            <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-center lg:justify-start gap-8">
               <div className="text-left">
                  <div className="text-3xl font-bold text-white"><CountUp end={2.4} decimals={1} prefix="R$ " suffix="M+" /></div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Patrimônio Gerido</div>
               </div>
               <div className="w-px h-10 bg-white/10"></div>
               <div className="text-left">
                  <div className="text-3xl font-bold text-white"><CountUp end={2} suffix="K+" /></div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Investidores</div>
               </div>
            </div>
          </div>

          {/* Imagem/Mockup do Dashboard */}
          <div className="lg:w-1/2 mt-16 lg:mt-0 relative w-full perspective-1000">
             <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white/10 transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out">
                {/* Janela de Navegador Fake */}
                <div className="h-8 bg-slate-900 flex items-center px-4 border-b border-white/5">
                   <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                   </div>
                </div>
                {/* Aqui idealmente seria um screenshot real, mas vamos usar um gradiente que simula o app */}
                <div className="aspect-video bg-[#0f172a] relative overflow-hidden flex flex-col p-4">
                   {/* Esqueleto do app */}
                   <div className="flex gap-4 mb-4">
                      <div className="h-16 w-32 rounded-lg bg-white/5 border border-white/10 animate-pulse"></div>
                      <div className="h-16 w-32 rounded-lg bg-white/5 border border-white/10 animate-pulse"></div>
                      <div className="h-16 w-32 rounded-lg bg-white/5 border border-white/10 animate-pulse"></div>
                   </div>
                   <div className="flex gap-4 h-full">
                      <div className="flex-1 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden">
                        <LineChart className="absolute bottom-4 right-4 w-32 h-32 text-[var(--auth-brand)] opacity-20" />
                      </div>
                      <div className="w-1/3 space-y-4">
                         <div className="h-24 rounded-xl bg-white/5 border border-white/10"></div>
                         <div className="h-24 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 backdrop-blur-md relative overflow-hidden">
                            <Zap className="absolute text-indigo-400 w-10 h-10 top-2 right-2 opacity-50" />
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section id="features" className="py-24 bg-slate-50 relative">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-3">Vantagem Competitiva</h2>
            <h3 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900" style={{fontFamily: 'var(--font-heading)'}}>
              Por que somos diferentes?
            </h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Abandone planilhas complexas. Obtenha análises automatizadas e inteligência direto da fonte oficial da CVM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100">
             <div className="p-12 lg:p-16 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-center">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                   <Brain className="w-7 h-7 text-indigo-600" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-slate-900">RI Inteligente (Novo!)</h4>
                <p className="text-slate-600 leading-relaxed mb-6">
                   Um motor de IA que se conecta aos sites de Relações com Investidores e à CVM. O Trackerr lê balanços, releases e Fatos Relevantes em PDF e sumariza as informações críticas em segundos.
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                   <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">Resumo de Releases</span>
                   <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">Análise de FIIs</span>
                   <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">Direto da CVM</span>
                </div>
             </div>

             <div className="p-12 lg:p-16 flex flex-col justify-center bg-slate-50">
                <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mb-6">
                   <LineChart className="w-7 h-7 text-sky-600" />
                </div>
                <h4 className="text-2xl font-bold mb-4 text-slate-900">IA Insights & Dashboard</h4>
                <p className="text-slate-600 leading-relaxed mb-6">
                   Descubra pontos cegos no seu portfólio. Nossa IA avalia a proporção do seu capital, diversificação de setores, risco macroeconômico e rentabilidade comparada.
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                   <span className="bg-white border text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">Score de Risco</span>
                   <span className="bg-white border text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">Rentabilidade Real</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - 4 Tiers */}
      <section id="planos" className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{fontFamily: 'var(--font-heading)'}}>
              Planos desenhados para você
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Seja um investidor iniciante ou um gestor avançado, temos o modelo perfeito para acompanhar seu patrimônio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* FREE */}
            <Card className="border-slate-200 shadow-none hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden flex flex-col">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Free</h3>
                  <p className="text-sm text-slate-500 mb-4">Essencial para iniciantes</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">Grátis</span>
                  </div>
                </div>
                <div className="space-y-4 mb-8 text-sm text-slate-700 flex-1">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Até 10 ativos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>1 Carteira ativa</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Calendário de proventos</span>
                  </div>
                </div>
                <Link to="/register" className="mt-auto block">
                  <Button variant="outline" className="w-full h-12 rounded-full border-slate-300 text-slate-700 hover:bg-slate-50">Começar</Button>
                </Link>
              </CardContent>
            </Card>

            {/* PRO */}
            <Card className="border-slate-200 shadow-none hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden flex flex-col">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Pro</h3>
                  <p className="text-sm text-slate-500 mb-4">Investidores em crescimento</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg text-slate-500 font-medium">R$</span>
                    <span className="text-4xl font-bold text-slate-900">29</span>
                    <span className="text-slate-500">/mês</span>
                  </div>
                </div>
                <div className="space-y-4 mb-8 text-sm text-slate-700 flex-1">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span><b>Ativos Ilimitados</b></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Até 3 Carteiras</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>RI Inteligente (Leitura)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>3 Alertas de preço</span>
                  </div>
                </div>
                <Link to="/register" className="mt-auto block">
                  <Button className="w-full h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-md">Assinar Pro</Button>
                </Link>
              </CardContent>
            </Card>

            {/* PREMIUM */}
            <Card className="border-indigo-500/50 shadow-2xl shadow-indigo-500/10 transition-all duration-300 rounded-3xl overflow-hidden relative flex flex-col scale-105 z-10 bg-white">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="inline-flex mb-4">
                   <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Mais Popular</span>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Premium</h3>
                  <p className="text-sm text-slate-500 mb-4">Para quem busca alfa</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg text-slate-500 font-medium">R$</span>
                    <span className="text-4xl font-bold text-slate-900">59</span>
                    <span className="text-slate-500">/mês</span>
                  </div>
                </div>
                <div className="space-y-4 mb-8 text-sm text-slate-700 flex-1">
                  <div className="flex items-center gap-3 font-semibold text-slate-900">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Tudo do PRO</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Até 5 Carteiras</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span><b>RI + Resumo por IA</b></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Exportação de IR e DARF</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Chat IA (Básico)</span>
                  </div>
                </div>
                <Link to="/register" className="mt-auto block">
                  <Button className="w-full h-12 rounded-full shadow-lg shadow-indigo-500/25" style={{background: 'var(--auth-brand)', color: 'white'}}>Assinar Premium</Button>
                </Link>
              </CardContent>
            </Card>

            {/* GLOBAL INVESTOR */}
            <Card className="border-slate-200 shadow-none hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden flex flex-col bg-slate-50">
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Global Investor</h3>
                  <p className="text-sm text-slate-500 mb-4">Gestão patrimonial completa</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">Custom</span>
                  </div>
                </div>
                <div className="space-y-4 mb-8 text-sm text-slate-700 flex-1">
                  <div className="flex items-center gap-3 font-semibold text-slate-900">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Tudo do PREMIUM</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Carteiras ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Chat IA Avançado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>Integração B3 CEI</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span>API Institucional</span>
                  </div>
                </div>
                 <a href="mailto:contato@trackerr.com" className="mt-auto block">
                  <Button variant="outline" className="w-full h-12 rounded-full border-slate-300 bg-white">Falar com Consultor</Button>
                </a>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-6 py-20 max-w-7xl">
        <div className="rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden" style={{background: 'linear-gradient(135deg, var(--auth-panel), #1e293b)'}}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 tracking-tight">Experimente a gestão inteligente hoje mesmo.</h2>
            <p className="text-lg text-slate-300 mb-10">
              Transforme a maneira como você investe, estuda o mercado e declara seus impostos. Criação de conta em menos de 1 minuto.
            </p>
            <Link to="/register">
              <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-2xl shadow-indigo-500/30 rounded-full" style={{background: 'var(--auth-brand)', color: 'white'}}>
                Criar Conta Gratuitamente
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Profissional */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <img src={trakkerLogo} alt="Trackerr" className="h-8 mb-6" />
              <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                Terminal financeiro de última geração para investidores individuais e assets. Fornecendo ferramentas de nível institucional de forma democratizada.
              </p>
              <div className="flex items-center gap-4">
                 <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[var(--auth-brand)] hover:bg-indigo-50 transition-colors"><Linkedin className="w-5 h-5" /></a>
                 <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[var(--auth-brand)] hover:bg-indigo-50 transition-colors"><Twitter className="w-5 h-5" /></a>
                 <a href="mailto:suporte@trackerr.com" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[var(--auth-brand)] hover:bg-indigo-50 transition-colors"><Mail className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider">Produto</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[var(--auth-brand)] transition-colors">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-[var(--auth-brand)] transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-[var(--auth-brand)] transition-colors">RI Inteligente</a></li>
                <li><a href="#" className="hover:text-[var(--auth-brand)] transition-colors">Release Notes</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider">Empresa</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[var(--auth-brand)] transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-[var(--auth-brand)] transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-[var(--auth-brand)] transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-[var(--auth-brand)] transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© {new Date().getFullYear()} Trackerr Intelligence. Todos os direitos reservados.</p>
            <p className="flex items-center gap-1">Feito com <span className="text-red-500">❤</span> para investidores brasileiros.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
