import {useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {SidebarTrigger} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import {Separator} from '@/components/ui/separator';
import {Skeleton} from '@/components/ui/skeleton';
import {
  ChevronDown,
  Download,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
  Wallet,
} from '@/components/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {CommandShortcut} from '@/components/ui/command';
import {cn} from '@/lib/utils';
import {useSubscription} from '@/hooks/useSubscription';
import {useCurrentUserProfile} from '@/hooks/useCurrentUserProfile';
import {useAdaptiveLevel, type AdaptiveLevel} from '@/contexts/AdaptiveLevelContext';
import {useCommandPalette} from '@/hooks/useCommandPalette';
import {useThemeToggle} from '@/components/ThemeToggle';
import {CommandPalette} from './CommandPalette';
import {NotificationBell} from './NotificationBell';
import {sections} from './nav-data';
import portfolioService from '@/services/portfolio';
import {CreatePortfolioDialog} from '@/components/portfolio/CreatePortfolioDialog';

type PageMeta = {crumb: string; title: string};

const OVERRIDES: Record<string, PageMeta> = {
  '/subscription': {crumb: 'Conta', title: 'Assinatura'},
  '/admin': {crumb: 'Administração', title: 'Admin Dashboard'},
  '/admin/plans': {crumb: 'Administração', title: 'Planos'},
  '/admin/grants': {crumb: 'Administração', title: 'Concessões'},
};

const LEVEL_OPTIONS: {id: AdaptiveLevel; label: string}[] = [
  {id: 'iniciante', label: 'Iniciante'},
  {id: 'intermediario', label: 'Intermediário'},
  {id: 'avancado', label: 'Avançado'},
];

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent);

function findMetaFromNav(pathname: string): PageMeta | null {
  for (const section of sections) {
    const hit = section.items.find(
      (i) => i.to === pathname || pathname.startsWith(i.to + '/'),
    );
    if (hit) return {crumb: section.label, title: hit.label};
  }
  return null;
}

function getPageMeta(pathname: string): PageMeta {
  if (OVERRIDES[pathname]) return OVERRIDES[pathname];
  if (pathname.startsWith('/portfolio/asset') || pathname.startsWith('/asset/')) {
    return {crumb: 'Carteira', title: 'Detalhe do Ativo'};
  }
  if (pathname.startsWith('/dividends/')) {
    return {crumb: 'Carteira', title: 'Detalhe de Dividendos'};
  }
  return findMetaFromNav(pathname) ?? {crumb: 'Trackerr', title: 'Trackerr'};
}

const EXPORT_ROUTES = new Set([
  '/dashboard',
  '/portfolio',
  '/dividends',
  '/transactions',
  '/fiscal',
]);

export function AppTopbar() {
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const meta = getPageMeta(pathname);
  const {displayPlanName, isSubscribed, isLoading} = useSubscription();
  const {data: profile} = useCurrentUserProfile();
  const {level, setLevel} = useAdaptiveLevel();
  const {open: paletteOpen, setOpen: setPaletteOpen} = useCommandPalette();
  const {theme, toggleTheme} = useThemeToggle();
  const [walletOpen, setWalletOpen] = useState(false);

  const {data: portfolios} = useQuery({
    queryKey: ['portfolios'],
    queryFn: () => portfolioService.getPortfolios(),
    staleTime: 60_000,
  });

  const portfolioCount = Array.isArray(portfolios) ? portfolios.length : 0;
  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : '';
  const fullName = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
    : '';
  const planLabel = isSubscribed
    ? `Plano ${displayPlanName ?? ''}`.trim()
    : 'Plano Free';
  const showExport = EXPORT_ROUTES.has(pathname);
  const themeLabel = theme === 'dark' ? 'Alternar para claro' : 'Alternar para escuro';

  const walletLabel = useMemo(() => {
    if (!portfolioCount) return 'Nenhuma carteira';
    return `${portfolioCount === 1 ? '1 conta' : `${portfolioCount} contas`}`;
  }, [portfolioCount]);

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-2.5 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <Separator orientation="vertical" className="h-6 md:hidden" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              <span>{meta.crumb}</span>
              <ChevronDown className="h-3 w-3 -rotate-90" />
              <span className="text-muted-foreground/70">{meta.title}</span>
            </div>
            <p className="mt-0.5 truncate text-[18px] font-semibold tracking-tight text-foreground">
              {meta.title}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="hidden h-8 min-w-[280px] items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:border-brand/60 hover:text-foreground md:flex">
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Buscar ativo, relatório, ação…</span>
          <CommandShortcut>{isMac ? '⌘K' : 'Ctrl+K'}</CommandShortcut>
        </button>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-8 w-20 rounded-md" />
          ) : !isSubscribed ? (
            <Button
              type="button"
              size="sm"
              className="hidden bg-primary text-primary-foreground shadow-sm hover:brightness-110 sm:flex"
              onClick={() => navigate('/subscription')}>
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Upgrade
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border/70 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <NotificationBell />

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-muted/60">
                <span
                  className="grid h-7 w-7 place-items-center rounded-lg text-[11px] font-semibold text-white"
                  style={{
                    background:
                      'linear-gradient(140deg, hsl(var(--brand)) 0%, hsl(var(--brand) / 0.65) 100%)',
                  }}>
                  {initials || <User className="h-3.5 w-3.5" />}
                </span>
                <span className="hidden leading-tight md:block">
                  <span className="block text-xs font-medium text-foreground">
                    {fullName || 'Usuário'}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">{planLabel}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/signout')}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/50 px-4 py-2 md:px-6">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2.5 h-[30px] text-xs">
          <Wallet className="h-3.5 w-3.5 text-brand" />
          <span className="text-foreground">Carteira consolidada</span>
          <span className="text-muted-foreground">· {walletLabel}</span>
          <ChevronDown className="ml-0.5 h-3 w-3 text-muted-foreground" />
        </div>

        <button
          type="button"
          onClick={() => setWalletOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand/45 bg-transparent px-2.5 h-[30px] text-xs text-brand transition-colors hover:border-solid hover:bg-brand/10">
          <Plus className="h-3.5 w-3.5" />
          <span>Nova carteira</span>
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground md:flex">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            <span>Profundidade definida pela IA</span>
          </div>
          <div
            role="radiogroup"
            aria-label="Nível de detalhe"
            className="inline-flex gap-0.5 rounded-lg border border-border/70 bg-background/80 p-0.5">
            {LEVEL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={opt.id === level}
                onClick={() => setLevel(opt.id)}
                className={cn(
                  'rounded px-2.5 py-1 text-[11px] font-medium transition-all',
                  opt.id === level
                    ? 'bg-muted text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                {opt.label}
              </button>
            ))}
          </div>
          {showExport ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-[30px] gap-1.5 border-brand/60 text-brand hover:bg-brand/10 hover:text-brand"
              onClick={() =>
                window.dispatchEvent(new CustomEvent('trackerr:export', {detail: {pathname}}))
              }>
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
          ) : null}
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <CreatePortfolioDialog open={walletOpen} onOpenChange={setWalletOpen} hideTrigger />
    </header>
  );
}
