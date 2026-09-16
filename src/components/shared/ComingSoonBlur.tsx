import React from 'react';
import useAppToast from '@/hooks/use-app-toast';

export interface ComingSoonBlurProps {
  /** Conteúdo real, renderizado por baixo — nunca removido do DOM. */
  children: React.ReactNode;
  title: string;
  description: string;
  icon?: string;
  ctaLabel?: string;
  /** Mensagem do toast ao clicar no CTA. */
  noticeMessage?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

/**
 * Blur "em breve" do handoff (ex.: hero de Ativo, apuração de IR): o
 * conteúdo real fica visível por baixo, borrado e sem interação, com um
 * cartão central explicando que a funcionalidade ainda está em
 * desenvolvimento. Não é um paywall — `PremiumBlur` cuida disso; aqui o
 * bloqueio vale para todo mundo, pago ou não, porque o recurso em si ainda
 * não está pronto para uso.
 */
export function ComingSoonBlur({
  children,
  title,
  description,
  icon = 'ph-fill ph-sparkle',
  ctaLabel = 'Avise-me quando lançar',
  noticeMessage = 'Anotado — você será avisado assim que este recurso for lançado.',
  minHeight,
  maxHeight,
  className,
}: ComingSoonBlurProps) {
  const toast = useAppToast();

  return (
    <div style={{position: 'relative'}} className={className}>
      <div
        aria-hidden
        style={{
          filter: 'blur(6px)',
          opacity: 0.5,
          pointerEvents: 'none',
          userSelect: 'none',
          minHeight,
          maxHeight,
          overflow: 'hidden',
        }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          background:
            'linear-gradient(to bottom, rgba(var(--rgb-bg),0) 0%, rgba(var(--rgb-bg),0.55) 22%, rgba(var(--rgb-bg),0.94) 55%)',
        }}>
        <div
          style={{
            maxWidth: 420,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            border: '1px solid var(--color-accent-700)',
            borderRadius: 8,
            background: 'var(--surf-4)',
            boxShadow: 'var(--shadow-lg)',
            padding: '28px 32px',
          }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 8,
              background: 'var(--grad-violet)',
              display: 'grid',
              placeItems: 'center',
            }}>
            <i className={icon} style={{fontSize: 24, color: 'var(--sunk)'}} aria-hidden />
          </div>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                margin: 0,
              }}>
              {title}
            </h2>
            <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)', marginTop: 8.4, lineHeight: 1.55}}>
              {description}
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.success('Anotado', noticeMessage)}
            className="hover:bg-[rgba(152,160,171,0.12)]"
            style={{
              height: 34,
              padding: '0 16.8px',
              borderRadius: 8,
              border: '1px solid var(--color-accent)',
              background: 'transparent',
              color: 'var(--color-accent-200)',
              fontFamily: 'var(--font-body)',
              fontSize: 12.5,
              fontWeight: 500,
              cursor: 'pointer',
            }}>
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
