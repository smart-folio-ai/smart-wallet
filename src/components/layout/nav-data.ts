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
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

export const sections: NavSection[] = [
  {
    label: 'Carteira',
    items: [
      {to: '/dashboard', label: 'Dashboard', icon: BarChart3},
      {to: '/portfolio', label: 'Portfólio', icon: Layers},
      {to: '/dividends', label: 'Dividendos', icon: Coins},
      {to: '/transactions', label: 'Transações', icon: ArrowUpDown},
      {to: '/add-asset', label: 'Adicionar Ativo', icon: Plus},
    ],
  },
  {
    label: 'Inteligência',
    items: [
      {to: '/ai-insights', label: 'IA Insights', icon: Sparkles},
      {to: '/chat-inteligente', label: 'Copiloto', icon: MessageSquare},
      {to: '/asset-search', label: 'Buscar Ativos', icon: Search},
      {to: '/ri-inteligente', label: 'RI Inteligente', icon: FileText},
      {to: '/comparator', label: 'Comparador', icon: GitCompare},
    ],
  },
  {
    label: 'Planejamento',
    items: [
      {to: '/planning', label: 'Planejamento', icon: Calculator},
      {to: '/fiscal', label: 'Fiscal', icon: FileSpreadsheet},
    ],
  },
  {
    label: 'Conta',
    items: [
      {to: '/settings', label: 'Configurações', icon: Settings},
      {to: '/subscription', label: 'Assinatura', icon: Crown},
      {
        to: '/sync-accounts',
        label: 'Contas Conectadas',
        icon: Landmark,
      },
    ],
  },
];
