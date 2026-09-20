import type {ReactNode} from 'react';
import {Receipt, Sparkles, Stack} from '@/components/ui/icons';
import {AppLogo} from '@/components/AppLogo';
import {ThemeToggle} from '@/components/ThemeToggle';

/**
 * Casca das telas de autenticação do handoff (`Trackerr Auth.dc.html`):
 * grade de duas colunas, `aside` de marca à esquerda e `main` centralizado
 * com largura máxima de 404px à direita.
 *
 * Extraído porque o `aside` estava duplicado inline em `SignIn` e
 * `Register`, e a tela de segundo fator seria a terceira cópia. As duas
 * telas de login ainda não migraram — fazer isso no mesmo passo que corrige
 * o 2FA misturaria refactor amplo com entrega funcional.
 */
const proofPoints = [
  {
    icon: Stack,
    title: 'Consolidação multi-corretora',
    body: 'B3, corretoras nacionais e cripto em um único patrimônio, sem planilha.',
  },
  {
    icon: Sparkles,
    title: 'Copiloto com trilha de auditoria',
    body: 'Cada insight traz fonte, janela de dados e nível de confiança do modelo.',
  },
  {
    icon: Receipt,
    title: 'Fiscal calculado, não estimado',
    body: 'Apuração mensal, prejuízo compensado e DARF com o valor a pagar.',
  },
];

const trustStats = [
  {value: 'Argon2id', label: 'hash de senha'},
  {value: '2FA', label: 'TOTP disponível'},
  {value: 'TLS', label: 'tráfego cifrado'},
  {value: 'LGPD', label: 'exporte ou apague'},
];

export function AuthLayout({children}: {children: ReactNode}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,1fr)',
        fontFamily: 'var(--font-body)',
      }}
      className="max-lg:!grid-cols-1">
      <div style={{position: 'fixed', top: 17, right: 17, zIndex: 40}}>
        <ThemeToggle />
      </div>

      <aside
        className="max-lg:hidden"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid var(--hair)',
          background:
            'linear-gradient(140deg, rgba(111,94,217,0.42) 0%, rgba(76,201,240,0.16) 46%, transparent 100%), var(--sunk)',
        }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(720px 380px at 14% 8%, rgba(145,132,217,0.34), rgba(145,132,217,0) 66%), radial-gradient(620px 340px at 88% 96%, rgba(47,214,163,0.20), rgba(47,214,163,0) 66%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '44px 48px',
          }}>
          <div style={{display: 'flex', alignItems: 'center', gap: 11}}>
            <AppLogo variant="icon" size="md" />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 17,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}>
                Trackerr
              </div>
              <div style={{fontSize: 11, color: 'var(--color-neutral-500)'}}>
                patrimônio sob controle
              </div>
            </div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
            {proofPoints.map((item) => (
              <div key={item.title} style={{display: 'flex', gap: 11.2}}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    flexShrink: 0,
                    borderRadius: 8,
                    border: '1px solid var(--hair)',
                    background: 'rgba(var(--rgb-bg),0.55)',
                    display: 'grid',
                    placeItems: 'center',
                  }}>
                  <item.icon
                    className="h-3 w-3"
                    weight="fill"
                    style={{color: 'var(--ac)'} as React.CSSProperties}
                  />
                </div>
                <div>
                  <div style={{fontSize: 13, fontWeight: 500}}>{item.title}</div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--color-neutral-400)',
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}>
                    {item.body}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              flexWrap: 'wrap',
              paddingTop: 22,
              borderTop: '1px solid var(--hair)',
            }}>
            {trustStats.map((stat) => (
              <div key={stat.label}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--color-neutral-100)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                  {stat.value}
                </div>
                <div style={{fontSize: 10.5, color: 'var(--color-neutral-500)', marginTop: 2}}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '44px 32px',
          background:
            'radial-gradient(680px 420px at 78% -10%, rgba(111,94,217,0.24) 0%, transparent 60%), var(--surf-1)',
        }}>
        <div style={{width: '100%', maxWidth: 404}}>{children}</div>
      </main>
    </div>
  );
}
