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
import {AppLogo} from '@/components/AppLogo';
import {ThemeToggle} from '@/components/ThemeToggle';
import {
  CircleDollarSign,
  ShieldCheck,
  Users,
} from '@/components/ui/icons';
import {NavLink} from 'react-router-dom';
import {useAuth} from '@/hooks/useAuth';
import {sections, type NavItem} from './layout/nav-data';

function SidebarLink({to, label, icon: Icon}: NavItem) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={to}
          end={to === '/dashboard'}
          className={({isActive}) =>
            [
              'group flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium transition-all',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_hsl(var(--sidebar-border))]'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground',
            ].join(' ')
          }>
          <Icon className="h-4 w-4 shrink-0 text-current" />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const {role} = useAuth();
  const adminItems: NavItem[] =
    role === 'admin'
      ? [
          {to: '/admin', label: 'Dashboard Admin', icon: ShieldCheck},
          {to: '/admin/plans', label: 'Planos', icon: Users},
          {to: '/admin/grants', label: 'Concessões', icon: CircleDollarSign},
        ]
      : role === 'editor'
        ? [{to: '/admin/grants', label: 'Concessões', icon: CircleDollarSign}]
        : [];

  return (
    <Sidebar variant="inset" collapsible="icon" className="z-40">
      <SidebarHeader className="border-b border-sidebar-border/60 py-4">
        <div className="flex items-center justify-between px-4">
          <AppLogo size="md" />
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

        {adminItems.length ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarLink key={item.to} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/45">
          <ShieldCheck className="h-3 w-3" />
          SOC 2 · LGPD
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
