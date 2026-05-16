import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import {Link} from 'react-router-dom';
import trakkerLogo from '@/assets/logo.png';
import {useEffect, useRef, useState} from 'react';

const valueCards = [
  {
    title: 'Análise de carteira com contexto real',
    description:
      'A IA cruza concentração, risco e performance para mostrar onde agir primeiro.',
    icon: BarChart3,
  },
  {
    title: 'Portfólio, fiscal e RI no mesmo fluxo',
    description:
      'Sem troca de ferramenta: você compara ativos, simula impacto fiscal e lê RI com síntese rápida.',
    icon: Brain,
  },
  {
    title: 'Execução orientada por prioridade',
    description:
      'Alertas e recomendações chegam com direção prática para a próxima decisão.',
    icon: Target,
  },
];

const planItems = [
  {
    name: 'Básico',
    price: 'Grátis',
    detail: 'Para começar com organização e visão clara de carteira',
    aiPillar: 'Base inteligente para evoluir para análises avançadas com IA',
    cta: 'Começar Grátis',
    href: '/register',
    featured: false,
    benefits: [
      'Até 10 ativos',
      'Dashboard essencial',
      'Acompanhamento básico',
      'Estrutura pronta para evoluir com IA',
    ],
  },
  {
    name: 'Premium',
    price: 'R$ 29',
    period: '/mês',
    detail: 'Camada de IA para decisão recorrente no dia a dia',
    aiPillar:
      'IA em carteira, portfólio, fiscal, RI e comparador com priorização prática',
    cta: 'Assinar Premium',
    href: '/register',
    featured: true,
    benefits: [
      'Ativos ilimitados',
      'Análise de carteira e portfólio com IA',
      'Simulação fiscal orientada',
      'RI inteligente com resumo acionável',
      'Comparador de ativos com sinais de oportunidade',
      'Alertas personalizados',
    ],
  },
  {
    name: 'Global Investor',
    price: 'Sob consulta',
    detail: 'Inteligência avançada para operação de maior escala',
    aiPillar:
      'Copilot completo: fiscal, RI, comparador, radar de oportunidade e cenário futuro',
    cta: 'Falar com Especialista',
    href: '/register',
    featured: false,
    benefits: [
      'Tudo do Premium',
      'Copilot de análise global',
      'Radar de oportunidade com IA',
      'Simulador de cenários futuros',
      'API dedicada',
      'Suporte prioritário',
      'Gestão multiportfólio',
    ],
  },
];

const marketTape = [
  {symbol: 'PETR4', price: 'R$ 39,82', change: '+2,14%'},
  {symbol: 'VALE3', price: 'R$ 67,19', change: '+1,37%'},
  {symbol: 'ITUB4', price: 'R$ 35,66', change: '+0,92%'},
  {symbol: 'WEGE3', price: 'R$ 46,20', change: '+3,08%'},
  {symbol: 'AAPL', price: 'US$ 218,44', change: '+0,88%'},
  {symbol: 'MSFT', price: 'US$ 432,51', change: '+1,11%'},
];

const returnCards = [
  {label: 'Retorno 30D', value: '+8,42%'},
  {label: 'Alpha vs IBOV', value: '+3,07%'},
  {label: 'Dividend Yield 12M', value: '+5,13%'},
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [canParallax, setCanParallax] = useState(false);
  const [enableMotion, setEnableMotion] = useState(true);
  const canParallaxRef = useRef(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = window.matchMedia('(min-width: 1024px)');

    const updateMotionPrefs = () => {
      const allowMotion = !reducedMotion.matches;
      const allowParallax = allowMotion && desktop.matches;
      setEnableMotion(allowMotion);
      setCanParallax(allowParallax);
      canParallaxRef.current = allowParallax;
    };

    updateMotionPrefs();

    reducedMotion.addEventListener('change', updateMotionPrefs);
    desktop.addEventListener('change', updateMotionPrefs);

    let ticking = false;

    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);

      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        setScrollY(canParallaxRef.current ? window.scrollY : 0);
        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, {passive: true});

    return () => {
      reducedMotion.removeEventListener('change', updateMotionPrefs);
      desktop.removeEventListener('change', updateMotionPrefs);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  const heroGlowOffset = canParallax ? Math.min(scrollY * 0.1, 92) : 0;
  const heroPanelOffset = canParallax ? Math.min(scrollY * 0.08, 56) : 0;
  const plansAuraOffset = canParallax
    ? Math.max(Math.min((scrollY - 420) * 0.12, 90), -30)
    : 0;

  return (
    <main
      className="min-h-screen text-foreground"
      style={{
        fontFamily: 'var(--font-body)',
        background:
          'radial-gradient(1300px 540px at 50% -120px, var(--auth-brand-soft-20), transparent 62%), linear-gradient(180deg, var(--auth-bg) 0%, var(--auth-panel) 34%, hsl(var(--background)) 100%)',
      }}>
      <style>{`
        @keyframes tickerSlide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }

        @keyframes drawLine {
          from { stroke-dashoffset: 620; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes riseValue {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/10 bg-[#060d20]/85 backdrop-blur-xl'
            : 'bg-transparent'
        }`}>
        <div className="container mx-auto px-4 py-4 sm:px-6">
          <nav
            className="flex items-center justify-between"
            aria-label="Navegação principal">
            <div className="flex items-center gap-3">
              <img src={trakkerLogo} alt="trackerr" className="h-16 w-auto" />
              {/* <span className="text-lg font-semibold lowercase tracking-tight text-white">
                trackerr
              </span> */}
            </div>

            <div className="hidden md:flex items-center gap-7 text-sm">
              <button
                onClick={() => scrollToSection('inicio')}
                className="text-[#dbe2fd] transition-colors hover:text-white">
                Início
              </button>
              <button
                onClick={() => scrollToSection('sobre')}
                className="text-[#dbe2fd] transition-colors hover:text-white">
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection('planos')}
                className="text-[#dbe2fd] transition-colors hover:text-white">
                Planos
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/signin">
                <Button
                  variant="ghost"
                  className="text-[#dbe2fd] hover:bg-white/10 hover:text-white">
                  Entrar
                </Button>
              </Link>
              <Link to="/register">
                <Button className="gap-2 shadow-[0_12px_30px_-12px_rgba(38,101,253,0.8)]">
                  Criar Conta
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <section
        id="inicio"
        className="relative overflow-hidden pt-28 sm:pt-32 lg:pt-36">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[440px]"
          style={{
            transform: `translate3d(0, ${heroGlowOffset}px, 0)`,
            background:
              'radial-gradient(circle at 16% 28%, var(--auth-brand-soft-40) 0%, transparent 52%), radial-gradient(circle at 86% 4%, var(--auth-highlight-soft) 0%, transparent 44%)',
          }}
        />

        <div className="container mx-auto grid max-w-6xl gap-10 px-4 pb-12 sm:px-6 lg:grid-cols-[1.06fr_1fr] lg:items-center lg:gap-12 lg:pb-20">
          <div className="relative z-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-[#b5c4ff]">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma financeira guiada por IA
            </div>

            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:max-w-[460px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#2665fd] to-[#0050e1] shadow-[0_14px_30px_-14px_rgba(38,101,253,0.9)] sm:h-20 sm:w-20">
                <img
                  src={trakkerLogo}
                  alt="Logo trackerr"
                  className="h-12 w-auto sm:h-14"
                />
              </div>
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#9eb3ff]">
                  Wealth Intelligence Platform
                </p>
                <p className="text-3xl font-black lowercase leading-none text-white sm:text-5xl">
                  trackerr
                </p>
              </div>
            </div>

            <h1 className="max-w-xl text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Seu terminal de mercado para decidir mais rápido e melhor.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#c3c5d8] sm:text-lg">
              A IA da trackerr analisa carteira, portfólio, fiscal, RI,
              comparador e cenário futuro em tempo quase real para transformar
              dados em ação.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 px-8 text-base">
                  Começar gratuitamente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/signin" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/20 bg-white/5 text-[#dbe2fd] hover:bg-white/10 hover:text-white">
                  Já tenho conta
                </Button>
              </Link>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {returnCards.map((item, idx) => (
                <Card
                  key={item.label}
                  className="border-white/10 bg-white/5 backdrop-blur-sm"
                  style={{
                    animation: enableMotion
                      ? `riseValue ${2.8 + idx * 0.35}s ease-in-out infinite`
                      : 'none',
                  }}>
                  <CardContent className="p-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#9eb3ff]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-[#e6ecff]">
                      {item.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div
            className="relative z-10"
            style={{transform: `translate3d(0, ${heroPanelOffset}px, 0)`}}>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1326]/80 p-5 shadow-[0_34px_80px_-38px_rgba(0,0,0,0.85)] backdrop-blur-md sm:p-6">
              <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,var(--auth-brand-soft-40)_0%,transparent_68%)]" />
              <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,var(--auth-highlight)_0%,transparent_72%)]" />

              <div className="relative">
                <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#9eb3ff]">
                      Market Pulse
                    </p>
                    <p className="text-sm font-semibold text-white">
                      Painel em tempo real
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs text-[#b5c4ff]">
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-[#2f71ff]"
                      style={{
                        animation: enableMotion
                          ? 'pulseDot 1.2s ease-in-out infinite'
                          : 'none',
                      }}
                    />
                    Online
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#071129]/85 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#9eb3ff]">
                      trackerr index
                    </p>
                    <div className="inline-flex items-center gap-1 text-sm font-bold text-[#dbe2fd]">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      +12,84%
                    </div>
                  </div>

                  <svg
                    viewBox="0 0 620 260"
                    className="h-52 w-full"
                    aria-label="Gráfico em alta">
                    <defs>
                      <linearGradient
                        id="chartStroke"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0">
                        <stop offset="0%" stopColor="#2f71ff" />
                        <stop offset="100%" stopColor="#8ab2ff" />
                      </linearGradient>
                      <linearGradient
                        id="chartFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1">
                        <stop offset="0%" stopColor="rgba(47,113,255,0.35)" />
                        <stop offset="100%" stopColor="rgba(47,113,255,0.02)" />
                      </linearGradient>
                    </defs>

                    <path
                      d="M20 220 L20 180 L90 170 L145 155 L212 162 L288 132 L355 138 L420 100 L490 86 L560 50 L600 32 L600 220 Z"
                      fill="url(#chartFill)"
                      opacity="0.95"
                    />

                    <path
                      d="M20 180 L90 170 L145 155 L212 162 L288 132 L355 138 L420 100 L490 86 L560 50 L600 32"
                      fill="none"
                      stroke="url(#chartStroke)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 620,
                        strokeDashoffset: enableMotion ? 620 : 0,
                        animation: enableMotion
                          ? 'drawLine 1.8s ease-out forwards'
                          : 'none',
                      }}
                    />

                    <circle cx="600" cy="32" r="7" fill="#9bc0ff" />
                  </svg>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Card
                    className="border-white/10 bg-white/5"
                    style={{
                      animation: enableMotion
                        ? 'floatCard 3.4s ease-in-out infinite'
                        : 'none',
                    }}>
                    <CardContent className="p-3">
                      <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[#9eb3ff]">
                        Retorno diário
                      </p>
                      <p className="mt-1 text-lg font-black text-white">
                        +2,47%
                      </p>
                    </CardContent>
                  </Card>
                  <Card
                    className="border-white/10 bg-white/5"
                    style={{
                      animation: enableMotion
                        ? 'floatCard 3.4s ease-in-out infinite 0.35s'
                        : 'none',
                    }}>
                    <CardContent className="p-3">
                      <p className="text-[0.65rem] uppercase tracking-[0.12em] text-[#9eb3ff]">
                        Oportunidades IA
                      </p>
                      <p className="mt-1 text-lg font-black text-white">
                        07 ativos
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative border-y border-white/10 bg-[#071129]/70 py-3 backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#071129] to-transparent sm:w-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#071129] to-transparent sm:w-20" />

          <div className="overflow-hidden">
            <div
              className="flex min-w-max items-center gap-4"
              style={{
                animation: enableMotion
                  ? 'tickerSlide 26s linear infinite'
                  : 'none',
              }}>
              {[...marketTape, ...marketTape].map((item, index) => (
                <div
                  key={`${item.symbol}-${index}`}
                  className="flex min-w-[174px] items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9eb3ff]">
                      {item.symbol}
                    </p>
                    <p className="text-sm font-bold text-[#e6ecff]">
                      {item.price}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-[#dbe2fd]">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    {item.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="sobre"
        className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 space-y-4 text-center sm:mb-14">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Valor real
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Inteligência financeira completa em uma única interface.
          </h2>
          <p className="mx-auto max-w-2xl text-[#c3c5d8]">
            A trackerr integra sinais de mercado, dados reais da carteira e
            motores de IA para responder com clareza onde ajustar alocação,
            risco e execução.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {valueCards.map(({title, description, icon: Icon}) => (
            <Card
              key={title}
              className="group border-white/10 bg-[#0f1730]/75 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_16px_40px_-25px_rgba(38,101,253,0.7)]">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-[#c3c5d8]">
                  {description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid gap-4 rounded-2xl border border-white/10 bg-[#0b1326]/70 p-6 sm:grid-cols-3 sm:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#b5c4ff]">
              Realtime feel
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              Tickers, retornos e sinais de performance sempre visíveis.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#b5c4ff]">
              IA aplicada
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              Carteira, portfólio, fiscal, RI e comparador em decisões
              conectadas.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#b5c4ff]">
              Execução
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              Prioridades práticas para agir com segurança e velocidade.
            </p>
          </div>
        </div>
      </section>

      <section id="planos" className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-90"
          style={{
            transform: `translate3d(0, ${plansAuraOffset}px, 0)`,
            background:
              'radial-gradient(circle at 10% 50%, var(--auth-brand-soft-20) 0%, transparent 48%), radial-gradient(circle at 90% 10%, var(--auth-highlight-soft) 0%, transparent 46%)',
          }}
        />

        <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 space-y-4 text-center sm:mb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Planos
            </p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              IA financeira no nível que sua carteira exige
            </h2>
            <p className="mx-auto max-w-2xl text-[#c3c5d8]">
              Do acompanhamento essencial ao copilot completo: trackerr escala
              com sua carteira.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {planItems.map((plan) => (
              <Card
                key={plan.name}
                className={`relative h-full border ${
                  plan.featured
                    ? 'border-primary/60 bg-gradient-to-b from-primary/15 to-[#0b1326] shadow-[0_25px_45px_-28px_rgba(38,101,253,0.9)]'
                    : 'border-white/10 bg-[#0f1730]/75'
                }`}>
                {plan.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                    Mais escolhido
                  </span>
                ) : null}

                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-[#c3c5d8]">{plan.detail}</p>
                    <p className="mt-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-[#dbe2fd]">
                      {plan.aiPillar}
                    </p>
                    <div className="mt-4">
                      <span className="text-4xl font-extrabold text-white">
                        {plan.price}
                      </span>
                      {plan.period ? (
                        <span className="ml-1 text-sm text-[#c3c5d8]">
                          {plan.period}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ul className="mb-8 space-y-3">
                    {plan.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 text-primary" />
                        <span className="text-[#dbe2fd]">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.href} className="mt-auto">
                    <Button
                      variant={plan.featured ? 'default' : 'outline'}
                      className={`w-full ${
                        plan.featured
                          ? ''
                          : 'border-white/20 bg-transparent text-[#dbe2fd] hover:bg-white/10 hover:text-white'
                      }`}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-[#0b1326] via-[#101a37] to-[#0f1730]">
          <CardContent className="relative p-8 text-center sm:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background:
                  'radial-gradient(circle at 0% 0%, var(--auth-brand-soft-40), transparent 40%), radial-gradient(circle at 100% 100%, var(--auth-brand-soft-20), transparent 45%)',
              }}
            />

            <div className="relative z-10">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#b5c4ff]">
                <Activity className="h-3.5 w-3.5 text-primary" />
                Pronto para operar com inteligência
              </div>

              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Transforme sua leitura de mercado em decisões consistentes.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-[#c3c5d8] sm:text-lg">
                Crie sua conta e use a IA da trackerr para analisar carteira,
                fiscal, RI e oportunidades sem sair do fluxo.
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="w-full gap-2 px-10 sm:w-auto">
                    Começar agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/signin">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-white/20 bg-white/5 text-[#dbe2fd] hover:bg-white/10 hover:text-white sm:w-auto">
                    Entrar na plataforma
                  </Button>
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-[#b5c4ff]">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Sem cartão na criação
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Setup em poucos minutos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Dados protegidos
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-white/10 bg-[#060d20]/70">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-[#b5c4ff] sm:px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={trakkerLogo} alt="trackerr" className="h-8 w-auto" />
            <span className="font-semibold lowercase text-white">trackerr</span>
            <span>© 2026. Todos os direitos reservados.</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hover:text-white">Termos</span>
            <span className="hover:text-white">Privacidade</span>
            <span className="hover:text-white">Suporte</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
