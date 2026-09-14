export type NavItem = {
  to: string;
  label: string;
  /** Classe da fonte Phosphor, igual ao `NAV` do handoff (ex.: `ph ph-stack`). */
  icon: string;
  hint?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

/**
 * Espelha `NAV` de design_handoff_trackerr/Trackerr App.dc.html: mesmos
 * rótulos, ordem e ícones. "Ativo · {símbolo}" não entra aqui porque depende
 * do último ativo aberto — o menu lateral o insere logo depois de Dividendos.
 */
export const sections: NavSection[] = [
  {
    label: 'Carteira',
    items: [
      {to: '/dashboard', label: 'Dashboard', icon: 'ph ph-squares-four', hint: 'visão consolidada'},
      {to: '/portfolio', label: 'Portfólio', icon: 'ph ph-stack', hint: 'todas as posições'},
      {to: '/dividends', label: 'Dividendos', icon: 'ph ph-hand-coins', hint: 'proventos recebidos'},
      {to: '/transactions', label: 'Transações', icon: 'ph ph-arrows-left-right', hint: 'histórico operacional'},
      {to: '/add-asset', label: 'Adicionar ativo', icon: 'ph ph-plus-circle', hint: 'importar ou lançar'},
    ],
  },
  {
    label: 'Inteligência',
    items: [
      {to: '/ai-insights', label: 'IA Insights', icon: 'ph ph-sparkle', hint: 'o que exige atenção'},
      {to: '/chat-inteligente', label: 'Copiloto', icon: 'ph ph-chat-teardrop-dots', hint: 'copiloto da carteira'},
      {to: '/ri-inteligente', label: 'RI Inteligente', icon: 'ph ph-file-magnifying-glass', hint: 'resumos de fatos relevantes'},
      {to: '/asset-search', label: 'Research', icon: 'ph ph-magnifying-glass', hint: 'screener e comparativo'},
      {to: '/comparator', label: 'Comparador', icon: 'ph ph-git-diff', hint: 'ativos lado a lado'},
    ],
  },
  {
    label: 'Planejamento',
    items: [
      {to: '/planning', label: 'Planejamento', icon: 'ph ph-target', hint: 'metas e projeções'},
      {to: '/fiscal', label: 'Fiscal & IR', icon: 'ph ph-receipt', hint: 'DARF e informe de IR'},
      {to: '/reports', label: 'Relatórios', icon: 'ph ph-file-text', hint: 'PDF, planilhas e agendamentos'},
    ],
  },
  {
    label: 'Conta',
    items: [
      {to: '/sync-accounts', label: 'Contas conectadas', icon: 'ph ph-plugs-connected', hint: 'corretoras e bancos'},
      {to: '/security', label: 'Segurança', icon: 'ph ph-fingerprint', hint: 'senha e dois fatores'},
      {to: '/subscription', label: 'Assinatura', icon: 'ph ph-crown-simple', hint: 'plano e cobrança'},
      {to: '/settings', label: 'Configurações', icon: 'ph ph-sliders-horizontal', hint: 'preferências'},
    ],
  },
];

const LAST_ASSET_KEY = 'trackerr:last-asset';

export type LastAsset = {symbol: string; to: string};

/** Rotas de detalhe que carregam o símbolo na URL. */
export function assetFromPath(pathname: string): LastAsset | null {
  const patterns = [
    /^\/portfolio\/asset\/symbol\/([^/]+)$/,
    /^\/asset\/([^/]+)$/,
    /^\/portfolio\/(?!asset$)([A-Za-z0-9.]+)$/,
  ];
  for (const pattern of patterns) {
    const match = pathname.match(pattern);
    if (match) {
      return {symbol: decodeURIComponent(match[1]).toUpperCase(), to: pathname};
    }
  }
  return null;
}

export function isAssetPath(pathname: string) {
  return (
    pathname.startsWith('/portfolio/asset/') ||
    pathname.startsWith('/asset/') ||
    assetFromPath(pathname) !== null
  );
}

export function readLastAsset(): LastAsset | null {
  try {
    const raw = localStorage.getItem(LAST_ASSET_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.symbol && parsed?.to ? parsed : null;
  } catch {
    return null;
  }
}

export function writeLastAsset(asset: LastAsset) {
  try {
    localStorage.setItem(LAST_ASSET_KEY, JSON.stringify(asset));
  } catch {
    // armazenamento indisponível (aba privada): o item só não aparece
  }
}
