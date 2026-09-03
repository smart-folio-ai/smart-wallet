import {
  BarChart3,
  Calculator,
  CircleDollarSign,
  FileSpreadsheet,
  FileText,
  GitCompare,
  Layers,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Star,
  Wallet,
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
      {to: '/dividends', label: 'Dividendos', icon: Wallet, hint: 'proventos recebidos'},
      {to: '/transactions', label: 'Transações', icon: Wallet, hint: 'histórico operacional'},
      {to: '/add-asset', label: 'Adicionar Ativo', icon: Plus, hint: 'importar ou lançar'},
    ],
  },
  {
    label: 'Inteligência',
    items: [
      {to: '/ai-insights', label: 'IA Insights', icon: Star, hint: 'o que exige atenção'},
      {to: '/chat-inteligente', label: 'Chat Inteligente', icon: MessageSquare, hint: 'copiloto da carteira'},
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
      {to: '/subscription', label: 'Assinatura', icon: CircleDollarSign, hint: 'plano e cobrança'},
      {
        to: '/sync-accounts',
        label: 'Contas Conectadas',
        icon: CircleDollarSign,
        hint: 'corretoras e bancos',
      },
    ],
  },
];
