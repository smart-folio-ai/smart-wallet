import {Link, useLocation} from 'react-router-dom';
import {AppLogo} from '@/components/AppLogo';
import {Button} from '@/components/ui/button';
import {ThemeToggle} from '@/components/ThemeToggle';
import {cn} from '@/lib/utils';

const legalTabs = [
  {label: 'Privacidade', to: '/privacidade'},
  {label: 'Termos', to: '/termos'},
  {label: 'Cookies', to: '/cookies'},
];

/**
 * Cabeçalho compartilhado das páginas legais (Termos, Privacidade, Cookies).
 *
 * Segue o mesmo padrão visual do header público usado na Landing
 * (LandingNav): logo à esquerda, navegação central e ações à direita, com
 * os mesmos tokens de superfície (surface-x / on-surface-x). A diferença é
 * que aqui a navegação são rotas reais entre os 3 documentos, não âncoras
 * de scroll.
 */
export function LegalHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-hairline/[0.07] bg-surface-base/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-5xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-on-surface">
          <AppLogo size="md" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {legalTabs.map((tab) => {
            const active = location.pathname === tab.to;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-colors',
                  active
                    ? 'font-semibold text-on-surface'
                    : 'text-on-surface-muted/60 hover:bg-surface-hairline/[0.06] hover:text-on-surface',
                )}>
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="text-on-surface-muted/70 hover:bg-surface-hairline/[0.06] hover:text-on-surface">
            <Link to="/signin">Entrar</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

export default LegalHeader;
