import {
  ArrowUpDown,
  BarChart3,
  Calculator,
  Coins,
  Crown,
  FileSpreadsheet,
  FileText,
  GitCompare,
  Landmark,
  Layers,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  type LucideIcon,
} from '@/components/ui/icons';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const sections: NavSection[] = [
  {
    label: 'Carteira',
    items: [
      {to: '/dashboard', label: 'Dashboard', icon: BarChart3, hint: 'visão consolidada'},
      {to: '/portfolio', label: 'Portfólio', icon: Layers, hint: 'todas as posições'},
      {to: '/dividends', label: 'Dividendos', icon: Coins, hint: 'proventos recebidos'},
      {to: '/transactions', label: 'Transações', icon: ArrowUpDown, hint: 'histórico operacional'},
      {to: '/add-asset', label: 'Adicionar Ativo', icon: Plus, hint: 'importar ou lançar'},
    ],
  },
  {
    label: 'Inteligência',
    items: [
      {to: '/ai-insights', label: 'IA Insights', icon: Sparkles, hint: 'o que exige atenção'},
      {to: '/chat-inteligente', label: 'Copiloto', icon: MessageSquare, hint: 'copiloto da carteira'},
      {to: '/asset-search', label: 'Buscar Ativos', icon: Search, hint: 'screener e comparativo'},
      {to: '/ri-inteligente', label: 'RI Inteligente', icon: FileText, hint: 'resumos de fatos relevantes'},
      {to: '/comparator', label: 'Comparador', icon: GitCompare, hint: 'ativos lado a lado'},
    ],
  },
  {
    label: 'Planejamento',
    items: [
      {to: '/planning', label: 'Planejamento', icon: Calculator, hint: 'metas e projeções'},
      {to: '/fiscal', label: 'Fiscal', icon: FileSpreadsheet, hint: 'DARF e informe de IR'},
    ],
  },
  {
    label: 'Conta',
    items: [
      {to: '/settings', label: 'Configurações', icon: Settings, hint: 'preferências'},
      {to: '/subscription', label: 'Assinatura', icon: Crown, hint: 'plano e cobrança'},
      {
        to: '/sync-accounts',
        label: 'Contas Conectadas',
        icon: Landmark,
        hint: 'corretoras e bancos',
      },
    ],
  },
];
