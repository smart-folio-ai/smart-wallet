import { SidebarTrigger } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

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
            onClick={() => navigate('/asset-search')}
          >
            <Search className="mr-2 h-3.5 w-3.5" />
            Buscar ativos
          </Button>

          <Badge variant="secondary" className="hidden sm:inline-flex">SaaS Preview</Badge>

          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notificações</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
