import {Link} from 'react-router-dom';
import trackerrLogo from '@/assets/logo.png';
import {footerColumns} from '../landing-data';

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-hairline/[0.07] bg-surface-panel/50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img src={trackerrLogo} alt="trackerr" className="h-8 w-auto" />
              <span className="font-heading text-base font-semibold text-on-surface">
                trackerr
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-surface-muted/45">
              Carteira consolidada, imposto calculado e IA apontando o que exige
              atenção.
            </p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title}>
              <h3 className="font-heading text-sm font-semibold text-on-surface">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.to.startsWith('#') ? (
                      // Âncora in-page: usa plain <a> para permitir scroll nativo
                      <a
                        href={link.to}
                        className="text-sm text-on-surface-muted/50 transition-colors hover:text-on-surface">
                        {link.label}
                      </a>
                    ) : (
                      // Rota de aplicação: usa Link do react-router
                      <Link
                        to={link.to}
                        className="text-sm text-on-surface-muted/50 transition-colors hover:text-on-surface">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-14 border-t border-surface-hairline/[0.05] pt-8 text-xs leading-relaxed text-on-surface-muted/35">
          © {year} Trackerr. Todos os direitos reservados. As informações
          exibidas têm caráter informativo e não constituem recomendação de
          investimento.
        </p>
      </div>
    </footer>
  );
}

export default LandingFooter;
