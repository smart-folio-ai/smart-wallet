import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/AppLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  BarChart3,
  Calculator,
  CircleDollarSign,
  FileSpreadsheet,
  GitCompare,
  Layers,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Star,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: 'Visão Geral',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
      { to: '/portfolio', label: 'Portfólio', icon: Layers },
      { to: '/planning', label: 'Planejamento', icon: Calculator },
      { to: '/comparator', label: 'Comparador', icon: GitCompare },
      { to: '/transactions', label: 'Transações', icon: Wallet },
      { to: '/fiscal', label: 'Fiscal', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Análise',
    items: [
      { to: '/ai-insights', label: 'IA Insights', icon: Star },
      { to: '/chat-inteligente', label: 'Chat Inteligente', icon: MessageSquare },
      { to: '/asset-search', label: 'Buscar Ativos', icon: Search },
    ],
  },
  {
    label: 'Carteira',
    items: [
      { to: '/add-asset', label: 'Adicionar Ativo', icon: Plus },
      { to: '/dividends', label: 'Dividendos', icon: Wallet },
    ],
  },
  {
    label: 'Conectar',
    items: [
      {
        to: '/sync-accounts',
        label: 'Sincronizar Contas',
        icon: CircleDollarSign,
      },
    ],
  },
];

const footerItems: NavItem[] = [
  { to: '/settings', label: 'Configurações', icon: Settings },
  { to: '/subscription', label: 'Assinatura', icon: Users },
  { to: '/signout', label: 'Sair', icon: LogOut },
];

function SidebarLink({ to, label, icon: Icon }: NavItem) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={to}
          end={to === '/dashboard'}
          className={({ isActive }) =>
            [
              'group flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium transition-all',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_hsl(var(--sidebar-border))]'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
            ].join(' ')
          }
        >
          <Icon className="h-4 w-4 shrink-0 text-current" />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon" className="z-40">
      <SidebarHeader className="border-b border-sidebar-border/60 py-4">
        <div className="flex items-center justify-between px-4">
          <AppLogo size="lg" />
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 py-3">
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
