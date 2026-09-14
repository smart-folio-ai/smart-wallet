/**
 * Conteúdo da Landing — textos e dados de design_handoff_trackerr/Trackerr
 * Landing.dc.html. Afirmações de segurança/compliance seguem o que é
 * verdadeiro hoje (AES-256, Argon2id, LGPD, 2FA): SOC 2 e o número de
 * uptime do protótipo foram removidos por decisão de produto.
 */

export type LandingLevel = 'iniciante' | 'intermediario' | 'avancado';
export type LandingLang = 'pt' | 'en' | 'es';

export const NAV_LINKS = [
  {label: 'Produto', href: '#produto'},
  {label: 'Como funciona', href: '#como-funciona'},
  {label: 'Segurança', href: '#seguranca'},
  {label: 'Planos', href: '#planos'},
  {label: 'FAQ', href: '#faq'},
];

export const LANGS: {code: LandingLang; title: string}[] = [
  {code: 'pt', title: 'Português'},
  {code: 'en', title: 'English'},
  {code: 'es', title: 'Español'},
];

export const MICRO_PROOF = [
  'Grátis até 10 ativos',
  'Sem cartão de crédito',
  'Implantação em minutos',
];

export const HERO_SERIES = [100, 103.2, 101.4, 106.8, 110.1, 108.4, 113.9, 117.2, 115.6, 121.4, 124.9, 128.7];

export const HERO_KPIS = [
  {label: 'Retorno 30D', value: '+8,42%'},
  {label: 'Alpha vs IBOV', value: '+3,07%'},
  {label: 'Yield 12M', value: '6,80%'},
];

export const TAPE = [
  {symbol: 'PETR4', price: 'R$ 41,28', change: '+2,14%', up: true},
  {symbol: 'VALE3', price: 'R$ 67,19', change: '+1,37%', up: true},
  {symbol: 'ITUB4', price: 'R$ 36,04', change: '-0,42%', up: false},
  {symbol: 'WEGE3', price: 'R$ 47,90', change: '+3,08%', up: true},
  {symbol: 'BBAS3', price: 'R$ 27,04', change: '-1,15%', up: false},
  {symbol: 'AAPL', price: 'US$ 218,44', change: '+0,88%', up: true},
  {symbol: 'MSFT', price: 'US$ 432,51', change: '+1,11%', up: true},
  {symbol: 'IVVB11', price: 'R$ 362,15', change: '+0,64%', up: true},
];

export const PRODUCT_BLOCKS = [
  {
    icon: 'ph ph-stack',
    title: 'Carteira consolidada',
    body: 'Todas as corretoras num só lugar, com alocação real por ativo, setor e classe. O número que aparece é o número certo, sem você somar nada.',
    proof: '3 contas · 27 posições · atualização em tempo real',
  },
  {
    icon: 'ph-fill ph-sparkle',
    title: 'Copiloto que prioriza',
    body: 'Não é um relatório para interpretar: é uma lista ordenada do que fazer, com a fonte de cada afirmação e o nível de confiança do modelo.',
    proof: 'trilha de auditoria em 100% dos insights',
  },
  {
    icon: 'ph ph-receipt',
    title: 'Fiscal resolvido',
    body: 'Apuração mensal automática, prejuízo compensado, isenção de R$ 20 mil aplicada e a DARF já calculada com o valor a pagar.',
    proof: 'DARF projetada · R$ 405 em set/26',
  },
];

export const LEVELS: {id: LandingLevel; label: string}[] = [
  {id: 'iniciante', label: 'Iniciante'},
  {id: 'intermediario', label: 'Intermediário'},
  {id: 'avancado', label: 'Avançado'},
];

export const LEVEL_VIEW: Record<
  LandingLevel,
  {title: string; tag: string; metrics: {label: string; value: string}[]; insight: string; footer: string}
> = {
  iniciante: {
    title: 'Resumo da carteira',
    tag: 'nível sugerido',
    metrics: [
      {label: 'Você tem', value: 'R$ 1,28M'},
      {label: 'Rendeu 12M', value: '+28,7%'},
      {label: 'Recebeu', value: 'R$ 74,2k'},
    ],
    insight:
      'Um ativo virou 11% da sua carteira. Concentração alta significa que um único papel move muito o seu resultado.',
    footer: 'Sem jargão, sem métrica de risco — o essencial em linguagem simples.',
  },
  intermediario: {
    title: 'Carteira vs benchmarks',
    tag: 'nível sugerido',
    metrics: [
      {label: 'Retorno 12M', value: '+28,7%'},
      {label: 'Alpha vs IBOV', value: '+14,1 p.p.'},
      {label: 'Yield on cost', value: '7,42%'},
    ],
    insight:
      'PETR4 está 2,9 p.p. acima do seu limite. Aparar 1.200 ações libera R$ 49,5k sem mexer no yield projetado.',
    footer: 'Comparativos, atribuição de retorno e impacto fiscal junto dos números.',
  },
  avancado: {
    title: 'Risco e atribuição',
    tag: 'nível sugerido',
    metrics: [
      {label: 'Sharpe', value: '1,42'},
      {label: 'VaR 95% 21d', value: 'R$ 41,2k'},
      {label: 'Tracking error', value: '6,4%'},
    ],
    insight:
      'PETR4 responde por 19,4% do VaR (peso 10,9%, beta 1,18). A 7% o VaR cai para R$ 35,8k e o TE de 6,4% para 5,1%.',
    footer: 'Cada número tem trilha de auditoria: fonte, janela e modelo usados.',
  },
};

export const STEPS = [
  {
    step: '01',
    title: 'Conecte sua carteira',
    body: 'Importe a nota de corretagem, o extrato da B3 ou sincronize direto com a corretora. Leva alguns minutos, uma vez só.',
  },
  {
    step: '02',
    title: 'A IA lê o contexto',
    body: 'Concentração, risco, exposição setorial e impacto fiscal são calculados em conjunto — não isolados em abas separadas.',
  },
  {
    step: '03',
    title: 'Decida com prioridade',
    body: 'Você recebe o que exige atenção agora, na ordem em que importa, com o motivo explicado em uma linha e a fonte a um clique.',
  },
];

export const TRUST = [
  {value: 'AES-256', label: 'Cifragem em repouso'},
  {value: 'Argon2id', label: 'Senhas com hash'},
  {value: 'LGPD', label: 'Tratamento de dados pessoais'},
  {value: '2FA', label: 'Autenticação em dois fatores'},
];

export const FAQ = [
  {
    question: 'Meus dados ficam seguros?',
    answer:
      'Sim. Os dados são cifrados em repouso com AES-256 e trafegam sempre por conexão cifrada. O tratamento segue a LGPD, e você pode exportar ou apagar tudo quando quiser, direto nas configurações da conta.',
  },
  {
    question: 'Funciona com a minha corretora?',
    answer:
      'O Trackerr importa nota de corretagem e extrato da B3, o que cobre qualquer corretora que opere no mercado brasileiro. Para as principais, há sincronização direta, sem importação manual.',
  },
  {
    question: 'Quem define o meu nível de investidor?',
    answer:
      'A IA sugere o nível a partir de sinais de uso — quais telas você abre, quais métricas consulta, como reage aos insights. A sugestão é sempre visível na topbar e você pode trocar quando quiser; nada fica escondido, só mais ou menos detalhado.',
  },
  {
    question: 'A IA recomenda o que comprar?',
    answer:
      'Não. O Trackerr não é consultoria de investimento e não indica ativos. Ele mostra o que está fora do que você mesmo definiu como estratégia — concentração acima do limite, por exemplo — com a fonte de cada afirmação.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'Sim, pelo próprio painel, sem falar com ninguém. O acesso continua até o fim do período já pago e sua carteira permanece disponível no plano Essencial.',
  },
];

export const CTA_BULLETS = [
  'Sem cartão para começar',
  'Cancelamento a qualquer momento',
  'Dados tratados conforme a LGPD',
];

export const CONTACT_EMAIL = 'suporte@trackerr.com.br';

export const FOOTER_COLUMNS: {title: string; links: {label: string; to: string}[]}[] = [
  {
    title: 'Produto',
    links: [
      {label: 'Como funciona', to: '#como-funciona'},
      {label: 'Planos', to: '#planos'},
      {label: 'Segurança', to: '#seguranca'},
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
