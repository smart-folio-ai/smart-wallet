import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Search, Settings, Sparkles } from '@/components/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from '@/components/ui/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useAdaptiveLevel, type AdaptiveLevel } from '@/contexts/AdaptiveLevelContext';
import { cn } from '@/lib/utils';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { CommandPalette } from './CommandPalette';
import { CommandShortcut } from '@/components/ui/command';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Visão consolidada da sua carteira e sinais do mercado.',
  },
  '/portfolio': {
    title: 'Portfólio',
    subtitle: 'Posições, alocação e desempenho dos seus ativos.',
  },
  '/asset-search': {
    title: 'Busca de Ativos',
    subtitle: 'Encontre ativos e compare fundamentos em segundos.',
  },
  '/planning': {
    title: 'Planejamento',
    subtitle: 'Simule cenários e alinhe metas financeiras.',
  },
  '/transactions': {
    title: 'Transações',
    subtitle: 'Acompanhe entradas, saídas e histórico operacional.',
  },
  '/fiscal': {
    title: 'Fiscal',
    subtitle: 'Organize dados para IR e obrigações tributárias.',
  },
  '/settings': {
    title: 'Configurações',
    subtitle: 'Preferências da conta e parâmetros da plataforma.',
  },
  '/dividends': {
    title: 'Dividendos',
    subtitle: 'Acompanhe eventos e históricos de proventos.',
  },
  '/admin': {
    title: 'Admin Dashboard',
    subtitle: 'Métricas essenciais da operação administrativa.',
  },
  '/admin/plans': {
    title: 'Admin Planos',
    subtitle: 'Cadastre, edite e desative planos com sincronização Stripe.',
  },
  '/admin/grants': {
    title: 'Admin Concessões',
    subtitle: 'Conceda planos manualmente e distribua permissões internas.',
  },
};

function getPageMeta(pathname: string) {
  if (pathname.startsWith('/portfolio/asset')) {
    return {
      title: 'Detalhe do Ativo',
      subtitle: 'Análise aprofundada com indicadores e fluxo de caixa.',
    };
  }

  if (pathname.startsWith('/asset/')) {
    return {
      title: 'Detalhe do Ativo',
      subtitle: 'Fundamentos, histórico e contexto do ativo selecionado.',
    };
  }

  if (pathname.startsWith('/dividends/')) {
    return {
      title: 'Detalhe de Dividendos',
      subtitle: 'Visão completa de JCP e dividendos por ativo.',
    };
  }

  return (
    PAGE_TITLES[pathname] ?? {
      title: 'Trackerr',
      subtitle: 'Plataforma moderna para gestão e inteligência financeira.',
    }
  );
}

export function AppTopbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const meta = getPageMeta(pathname);
  const { displayPlanName, isSubscribed, isLoading } = useSubscription();
  const { logout } = useAuth();
  const { data: profile } = useCurrentUserProfile();
  const { level, setLevel } = useAdaptiveLevel();
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const levelOptions: { id: AdaptiveLevel; label: string }[] = [
    { id: 'iniciante', label: 'Iniciante' },
    { id: 'intermediario', label: 'Intermediário' },
    { id: 'avancado', label: 'Avançado' },
  ];
  const initials = profile
    ? `${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : '';

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <Separator orientation="vertical" className="h-6 md:hidden" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">{meta.title}</p>
            <p className="hidden truncate text-xs text-muted-foreground md:block">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden border-border/70 bg-transparent text-muted-foreground hover:text-foreground lg:flex"
            onClick={() => setPaletteOpen(true)}
          >
            <Search className="mr-2 h-3.5 w-3.5" />
            Buscar ativos
            <CommandShortcut className="ml-2">⌘K</CommandShortcut>
          </Button>

          {isLoading ? (
            <Skeleton className="h-8 w-20 rounded-full" />
          ) : isSubscribed ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() => navigate('/subscription')}
            >
              {displayPlanName || 'Assinatura'}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="bg-primary text-primary-foreground shadow-sm hover:brightness-110"
              onClick={() => navigate('/subscription')}
            >
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Upgrade
            </Button>
          )}

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Configurações</span>
          </Button>

          <Button type="button" variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notificações</span>
          </Button>

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex h-11 items-center gap-2 px-2 text-muted-foreground hover:text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand">
                  {initials || <User className="h-3.5 w-3.5" />}
                </span>
                <span className="hidden text-sm font-medium text-foreground md:inline">
                  {profile?.firstName ?? ''}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center gap-3 border-t border-border/50 px-4 py-1.5 md:px-6">
        <div className="inline-flex gap-1 rounded-md bg-muted p-0.5">
          {levelOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLevel(opt.id)}
              className={cn(
                'rounded px-2.5 py-1 text-[11px] font-medium transition-all',
                opt.id === level
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}>
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-[10.5px] text-muted-foreground/70">
          Preferência salva
        </span>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
