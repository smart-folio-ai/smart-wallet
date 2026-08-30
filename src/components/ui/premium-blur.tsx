import React from 'react';
import {Button} from '@/components/ui/button';
import {Crown, X, Zap} from '@/components/ui/icons';
import {useNavigate} from 'react-router-dom';

interface PremiumBlurProps {
  children: React.ReactNode;
  /** Se false, exibe o conteúdo normalmente sem blur. Default: true (bloqueado) */
  locked?: boolean;
  title: string;
  description?: string;
  className?: string;
  /**
   * Chave da dispensa em sessionStorage. Default: `title`. Dois call sites
   * com o mesmo `title` (ou o mesmo `dismissKey`) compartilham a dispensa —
   * passe uma chave própria se o título puder mudar ou colidir.
   */
  dismissKey?: string;
}

const DISMISS_PREFIX = 'trackerr:premium-blur-dismissed:';

function readDismissed(title: string): boolean {
  try {
    return sessionStorage.getItem(DISMISS_PREFIX + title) === '1';
  } catch {
    // Navegação privada e storage desabilitado caem aqui. A dispensa é
    // conveniência; nunca deve impedir a página de renderizar.
    return false;
  }
}

function writeDismissed(title: string): void {
  try {
    sessionStorage.setItem(DISMISS_PREFIX + title, '1');
  } catch {
    // Sem persistência a faixa reaparece na próxima montagem. Aceitável.
  }
}

export const PremiumBlur = ({
  children,
  locked = true,
  title,
  description = 'Faça upgrade para acessar este recurso',
  className = '',
  dismissKey,
}: PremiumBlurProps) => {
  const navigate = useNavigate();
  const key = dismissKey ?? title;
  const [dismissed, setDismissed] = React.useState(() => readDismissed(key));

  if (!locked) {
    return <div className={className}>{children}</div>;
  }

  const dismiss = () => {
    writeDismissed(key);
    setDismissed(true);
  };

  return (
    <div className={className}>
      {!dismissed && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-4 w-4 text-primary" />
          </div>

          <div className="min-w-[140px] flex-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>

          <Button size="sm" onClick={() => navigate('/subscription')}>
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Fazer upgrade
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Fechar aviso de upgrade"
            onClick={dismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* O conteúdo segue borrado e sem interação: a pessoa enxerga a
          estrutura do que está bloqueado, o que convida melhor que um
          retângulo opaco. */}
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
};
