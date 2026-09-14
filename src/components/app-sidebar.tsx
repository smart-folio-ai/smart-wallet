import {useEffect, useState} from 'react';
import {NavLink, useLocation} from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {AppLogo} from '@/components/AppLogo';
import {useAuth} from '@/hooks/useAuth';
import {
  assetFromPath,
  isAssetPath,
  readLastAsset,
  sections,
  writeLastAsset,
  type LastAsset,
  type NavItem,
} from './layout/nav-data';

// Estilos de `navStyle` e do <aside> de design_handoff_trackerr/Trackerr App.dc.html.
const ITEM_BASE =
  'flex w-full items-center gap-[8.4px] rounded-[8px] px-[8.4px] py-[7px] text-[12.5px] font-medium transition-all duration-150';
const ITEM_IDLE =
  'text-[color:var(--color-neutral-400)] hover:bg-[rgba(152,160,171,0.10)] hover:text-[color:var(--color-neutral-100)]';
const ITEM_ACTIVE =
  'bg-[rgba(152,160,171,0.16)] text-[color:var(--color-accent-100)] shadow-[inset_0_0_0_1px_rgba(152,160,171,0.35)]';

function SidebarLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive?: (pathname: string) => boolean;
}) {
  const {pathname} = useLocation();
  return (
    <NavLink
      to={item.to}
      className={({isActive: routeActive}) => {
        const active = isActive ? isActive(pathname) : routeActive;
        return `${ITEM_BASE} ${active ? ITEM_ACTIVE : ITEM_IDLE}`;
      }}>
      <i className={item.icon} style={{fontSize: 15, opacity: 0.9}} aria-hidden="true" />
      <span className="flex-1 text-left group-data-[collapsible=icon]:hidden">{item.label}</span>
    </NavLink>
  );
}

function NavGroup({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex flex-col gap-[2.8px]">
      <div className="px-[8.4px] py-[5.6px] group-data-[collapsible=icon]:hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-neutral-600)]">
        {label}
      </div>
      {children}
    </div>
  );
}

export function AppSidebar() {
  const {role} = useAuth();
  const {pathname} = useLocation();
  const [lastAsset, setLastAsset] = useState<LastAsset | null>(readLastAsset);

  // O handoff tem "Ativo · PETR4" no menu: aqui é o último ativo aberto.
  useEffect(() => {
    const current = assetFromPath(pathname);
    if (current && current.to !== lastAsset?.to) {
      writeLastAsset(current);
      setLastAsset(current);
    }
  }, [pathname, lastAsset?.to]);

  const adminItems: NavItem[] =
    role === 'admin'
      ? [
          {to: '/admin', label: 'Dashboard Admin', icon: 'ph ph-shield-check'},
          {to: '/admin/plans', label: 'Planos', icon: 'ph ph-users'},
          {to: '/admin/grants', label: 'Concessões', icon: 'ph ph-currency-circle-dollar'},
        ]
      : role === 'editor'
        ? [{to: '/admin/grants', label: 'Concessões', icon: 'ph ph-currency-circle-dollar'}]
        : [];

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="z-40 border-r border-[color:var(--hair)] [&>[data-sidebar=sidebar]]:bg-[rgba(var(--rgb-bg),0.72)] [&>[data-sidebar=sidebar]]:backdrop-blur-[12px]">
      <SidebarHeader className="flex-row items-center gap-[8.4px] border-b border-[color:var(--hair-soft)] p-[16.8px]">
        <AppLogo variant="icon" size="md" className="text-[color:var(--color-text)]" />
        <div className="leading-[1.1] group-data-[collapsible=icon]:hidden">
          <div className="font-heading text-[15px] font-semibold tracking-[-0.015em] text-[color:var(--color-text)]">
            Trackerr
          </div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-[color:var(--color-neutral-500)]">
            Enterprise
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-[16.8px] px-[8.4px] py-[11.2px]">
        {sections.map((section) => (
          <NavGroup key={section.label} label={section.label}>
            {section.items.map((item) => (
              <div key={item.to} className="contents">
                <SidebarLink
                  item={item}
                  isActive={
                    item.to === '/portfolio'
                      ? (path) => path === '/portfolio'
                      : undefined
                  }
                />
                {item.to === '/dividends' && lastAsset ? (
                  <SidebarLink
                    item={{
                      to: lastAsset.to,
                      label: `Ativo · ${lastAsset.symbol}`,
                      icon: 'ph ph-chart-line-up',
                    }}
                    isActive={isAssetPath}
                  />
                ) : null}
              </div>
            ))}
          </NavGroup>
        ))}

        {adminItems.length ? (
          <NavGroup label="Administração">
            {adminItems.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                isActive={item.to === '/admin' ? (path) => path === '/admin' : undefined}
              />
            ))}
          </NavGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden border-t border-[color:var(--hair-soft)] p-[11.2px]">
        <div
          className="rounded-[8px] border border-[color:var(--hair)] p-[11.2px]"
          style={{
            background:
              'linear-gradient(180deg, rgba(var(--rgb-accent-deep),0.35), rgba(var(--rgb-surf),0.4))',
          }}>
          <div className="flex items-center gap-[5.6px] text-[11px] font-semibold text-[color:var(--color-accent-300)]">
            <i className="ph-fill ph-shield-check" style={{fontSize: 14}} aria-hidden="true" />
            <span>Ambiente seguro · LGPD</span>
          </div>
          <div className="mt-[5.6px] text-[11px] leading-[1.45] text-[color:var(--color-neutral-500)]">
            Dados cifrados AES-256 · senhas com Argon2id
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
