import {ReactNode} from 'react';
import {AlertTriangle} from '@/components/ui/icons';
import {LegalHeader} from '@/components/legal/LegalHeader';

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  list?: string[];
}

interface LegalDocLayoutProps {
  title: string;
  updatedLabel: string;
  sections: LegalSection[];
  /** Conteúdo extra renderizado após as seções (ex.: widget de cookies). */
  children?: ReactNode;
}

/**
 * Layout compartilhado das 3 páginas legais (Termos, Privacidade, Cookies).
 *
 * TOC da sidebar é gerado automaticamente a partir dos títulos das seções
 * (removendo o número "1. " do início), então nunca precisa ser mantido
 * manualmente em paralelo ao conteúdo — ver design_handoff_trackerr/
 * "Trackerr Legal.dc.html".
 */
export function LegalDocLayout({
  title,
  updatedLabel,
  sections,
  children,
}: LegalDocLayoutProps) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <LegalHeader />

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {/* Aviso de rascunho — obrigatório em todo conteúdo jurídico ainda
            não revisado por um advogado/contador. Não remover nem
            enfraquecer o texto sem aprovação jurídica. */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-on-surface">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" weight="fill" aria-hidden />
          <p className="leading-relaxed text-on-surface-muted">
            <span className="font-semibold text-on-surface">
              Este documento é um rascunho gerado para revisão jurídica.
            </span>{' '}
            Ele não constitui a versão final de {title} até aprovação de um
            advogado ou contador responsável. Não utilize este texto como
            base legal definitiva.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-0.5">
              <div className="px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-on-surface-muted/60">
                Nesta página
              </div>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-lg px-3 py-1.5 text-sm text-on-surface-muted/70 transition-colors hover:bg-surface-hairline/[0.06] hover:text-on-surface">
                  {section.title.replace(/^\d+\.\s*/, '')}
                </a>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brand">
              Legal
            </div>
            <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-on-surface">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-on-surface-muted/70">{updatedLabel}</p>

            <div className="mt-8 flex flex-col gap-7">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="mb-2 font-heading text-lg font-semibold tracking-tight text-on-surface">
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className="mb-2.5 text-sm leading-relaxed text-on-surface-muted/80">
                      {paragraph}
                    </p>
                  ))}
                  {section.list && section.list.length > 0 && (
                    <ul className="mb-2.5 flex list-disc flex-col gap-1.5 pl-5">
                      {section.list.map((item, index) => (
                        <li
                          key={index}
                          className="text-[13.5px] leading-relaxed text-on-surface-muted/80">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {children}
          </div>
        </div>
      </div>

      <footer className="border-t border-surface-hairline/[0.07]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-5 text-[11.5px] text-on-surface-muted/60 sm:px-6 lg:px-8">
          <span>
            © {new Date().getFullYear()} Trackerr Tecnologia Ltda · CNPJ [CNPJ
            a confirmar]
          </span>
          <span>SOC 2 Type II · LGPD · AES-256</span>
        </div>
      </footer>
    </div>
  );
}

export default LegalDocLayout;
