export const heroCopy = {
  title: 'Sua carteira inteira.',
  titleAccent: 'Sem planilha, sem surpresa no IR.',
  subtitle:
    'O Trackerr consolida seus ativos de todas as corretoras, calcula seu imposto e usa IA para te dizer o que exige atenção agora — não mais um relatório para você interpretar.',
  primaryCta: {label: 'Começar grátis', href: '/register'},
  secondaryCta: {label: 'Ver como funciona', href: '#produto'},
  microProof: ['Grátis até 10 ativos', 'Sem cartão de crédito'],
};

export const heroPanel = {
  title: 'Carteira consolidada',
  subtitle: 'Todas as corretoras · atualizado agora',
  equity: 284930,
  positions: 27,
  risk: 'Moderado',
  kpis: [
    {label: 'Retorno 30D', value: 8.42, suffix: '%'},
    {label: 'Alpha vs IBOV', value: 3.07, suffix: '%'},
    {label: 'Yield 12M', value: 5.13, suffix: '%'},
  ],
};

export interface TickerQuote {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

export const marketTape: TickerQuote[] = [
  {symbol: 'PETR4', price: 'R$ 39,82', change: '+2,14%', up: true},
  {symbol: 'VALE3', price: 'R$ 67,19', change: '+1,37%', up: true},
  {symbol: 'ITUB4', price: 'R$ 35,66', change: '-0,42%', up: false},
  {symbol: 'WEGE3', price: 'R$ 46,20', change: '+3,08%', up: true},
  {symbol: 'BBAS3', price: 'R$ 27,04', change: '-1,15%', up: false},
  {symbol: 'AAPL', price: 'US$ 218,44', change: '+0,88%', up: true},
  {symbol: 'MSFT', price: 'US$ 432,51', change: '+1,11%', up: true},
  {symbol: 'IVVB11', price: 'R$ 358,90', change: '+0,64%', up: true},
];

export const problemCopy = {
  title: 'Você não tem um problema de investimento.',
  titleAccent: 'Tem um problema de controle.',
  subtitle:
    'Quem já investe há algum tempo não trava por falta de ativo. Trava por falta de visão do conjunto.',
  cards: [
    {
      title: 'Ativos em três corretoras diferentes',
      description:
        'Cada uma mostra um pedaço. Nenhuma mostra o quadro completo, e a planilha que junta tudo está sempre desatualizada.',
    },
    {
      title: 'O IR vira um fim de semana perdido',
      description:
        'Apuração mês a mês, prejuízo a compensar, DARF a emitir. Feito na mão, com medo de errar e pagar a mais.',
    },
    {
      title: 'A concentração aparece tarde demais',
      description:
        'Você descobre que um papel virou um quarto da carteira quando ele cai — não quando ainda dava para reequilibrar.',
    },
  ],
};

export const productCopy = {
  title: 'Três coisas que você para de fazer na mão',
  subtitle:
    'Conecte uma vez. O acompanhamento passa a ser leitura, não digitação.',
  blocks: [
    {
      id: 'carteira' as const,
      title: 'Carteira consolidada',
      description:
        'Todas as corretoras num só lugar, com alocação real por ativo, setor e classe. O número que aparece é o número certo, sem você somar nada.',
    },
    {
      id: 'ia' as const,
      title: 'IA que prioriza',
      description:
        'Não é um relatório para interpretar: é uma lista ordenada do que fazer. Concentração acima do seu limite, aporte fora da estratégia, dividendo a reinvestir.',
    },
    {
      id: 'fiscal' as const,
      title: 'Fiscal resolvido',
      description:
        'Apuração mensal automática, prejuízo compensado, isenção de R$ 20 mil aplicada e a DARF já calculada com o valor a pagar.',
    },
  ],
};

export const workflowSteps = [
  {
    step: '01',
    title: 'Conecte sua carteira',
    description:
      'Importe a nota de corretagem, o extrato da B3 ou sincronize direto com a corretora. Leva alguns minutos, uma vez só.',
  },
  {
    step: '02',
    title: 'A IA lê o contexto',
    description:
      'Concentração, risco, exposição setorial e impacto fiscal são calculados em conjunto — não isolados em abas separadas.',
  },
  {
    step: '03',
    title: 'Decida com prioridade',
    description:
      'Você recebe o que exige atenção agora, na ordem em que importa, com o motivo explicado em uma linha.',
  },
];

export const trustStats = [
  {value: 'B3 + NYSE', label: 'Cobertura de mercado'},
  {value: 'Tempo real', label: 'Atualização de cotações'},
  {value: 'LGPD', label: 'Tratamento de dados'},
  {value: 'AES-256', label: 'Criptografia em repouso'},
];

export const faqItems = [
  {
    question: 'Meus dados ficam seguros?',
    answer:
      'Sim. Os dados são criptografados em repouso com AES-256 e trafegam sempre por conexão cifrada. O tratamento segue a LGPD, e você pode exportar ou apagar tudo quando quiser, direto nas configurações da conta.',
  },
  {
    question: 'Funciona com a minha corretora?',
    answer:
      'O Trackerr importa nota de corretagem e extrato da B3, o que cobre qualquer corretora que opere no mercado brasileiro. Para as principais, há também sincronização direta, sem importação manual.',
  },
  {
    question: 'O que o plano grátis inclui de verdade?',
    answer:
      'Até 10 ativos com consolidação completa, alocação e acompanhamento de proventos. Sem prazo de expiração e sem pedir cartão. A IA de priorização e o módulo fiscal são do Premium.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'Sim, pelo próprio painel, sem falar com ninguém. O acesso continua até o fim do período já pago e sua carteira permanece disponível no plano grátis.',
  },
  {
    question: 'O Trackerr recomenda o que comprar?',
    answer:
      'Não. O Trackerr não é consultoria de investimento e não indica ativos. Ele mostra o que está fora do que você mesmo definiu como estratégia — concentração acima do seu limite, por exemplo — e deixa a decisão com você.',
  },
];

export const finalCtaCopy = {
  title: 'Pare de consolidar carteira na mão',
  subtitle:
    'Conecte sua carteira e receba a primeira leitura de risco e concentração em minutos.',
  bullets: [
    'Sem cartão para começar',
    'Cancelamento a qualquer momento',
    'Dados tratados conforme a LGPD',
  ],
};

export const footerColumns = [
  {
    title: 'Produto',
    links: [
      {label: 'Como funciona', to: '#como-funciona'},
      {label: 'Planos', to: '#planos'},
      {label: 'Perguntas frequentes', to: '#faq'},
    ],
  },
  {
    title: 'Conta',
    links: [
      {label: 'Entrar', to: '/signin'},
      {label: 'Criar conta', to: '/register'},
      {label: 'Recuperar senha', to: '/forgot-password'},
    ],
  },
  {
    title: 'Legal',
    links: [
      {label: 'Termos de uso', to: '/termos'},
      {label: 'Política de privacidade', to: '/privacidade'},
      {label: 'Cookies', to: '/cookies'},
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────
 * Dados fictícios dos mockups de produto. Não são screenshots: são
 * componentes React, então acompanham o tema e podem ser animados.
 * ────────────────────────────────────────────────────────────────── */

export const portfolioMockupData = {
  total: 284930,
  positions: [
    {symbol: 'PETR4', name: 'Petrobras PN', weight: 23.4, change: '+2,14%', up: true},
    {symbol: 'ITUB4', name: 'Itaú Unibanco PN', weight: 14.8, change: '-0,42%', up: false},
    {symbol: 'VALE3', name: 'Vale ON', weight: 12.1, change: '+1,37%', up: true},
    {symbol: 'IVVB11', name: 'S&P 500 BDR', weight: 11.6, change: '+0,64%', up: true},
    {symbol: 'WEGE3', name: 'WEG ON', weight: 9.2, change: '+3,08%', up: true},
  ],
};

export const aiAlertMockupData = [
  {
    severity: 'alta' as const,
    title: 'Concentração acima do limite',
    detail: 'PETR4 representa 23,4% da carteira. Seu limite definido é 15%.',
  },
  {
    severity: 'média' as const,
    title: 'Dividendo parado em caixa',
    detail: 'R$ 3.412 recebidos em proventos há 38 dias, ainda sem reaporte.',
  },
  {
    severity: 'baixa' as const,
    title: 'Exposição setorial subiu',
    detail: 'Setor financeiro passou de 18% para 26% após o último aporte.',
  },
];

export const taxMockupData = {
  month: 'Março de 2026',
  sales: 92400,
  profit: 8320,
  offset: 3480,
  taxable: 4840,
  darf: 1284.6,
};
