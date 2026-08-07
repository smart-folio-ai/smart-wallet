import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

let scrollTriggerRegistered = false;

/**
 * Registra o ScrollTrigger sob demanda, e não no escopo do módulo.
 * O plugin toca window.matchMedia ao registrar, o que quebra em ambientes
 * sem DOM completo (jsdom/SSR) apenas por importar o arquivo.
 */
export function ensureScrollTrigger(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  if (!scrollTriggerRegistered) {
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
  }
  return true;
}

/**
 * Anima os elementos marcados com [data-reveal] dentro do container conforme
 * entram na viewport.
 *
 * Regras de acessibilidade e robustez:
 * - Respeita prefers-reduced-motion: quando ativo, nada é animado e os
 *   elementos permanecem visíveis (nunca escondemos conteúdo sem restaurá-lo).
 * - Usa gsap.context() para que todo tween/ScrollTrigger criado aqui seja
 *   revertido no unmount, evitando vazamento entre navegações SPA.
 * - `data-reveal-delay` (em segundos) permite escalonar itens irmãos.
 */
export function useGsapReveal<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    if (!ensureScrollTrigger()) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]');

      targets.forEach((el) => {
        const delay = Number(el.dataset.revealDelay || 0);

        gsap.fromTo(
          el,
          {opacity: 0, y: 24},
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            delay,
            ease: 'power2.out',
            // GSAP escreve `transform` inline e nunca limpa: sem isso, o
            // inline `translate(0px, 0px)` final vence permanentemente
            // qualquer transform de classe (ex.: lg:-translate-y-2 no card
            // Premium). Como y termina em 0 — a posição natural — soltar o
            // inline aqui é visualmente idêntico, só devolve o controle ao
            // CSS.
            clearProps: 'transform',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              once: true,
            },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return containerRef;
}

/**
 * Parallax leve por scroll. Só roda em telas grandes e com motion permitido —
 * em mobile o efeito atrapalha mais do que ajuda.
 */
export function useGsapParallax<T extends HTMLElement>(
  strength = 60,
): React.MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!ensureScrollTrigger()) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

    if (prefersReduced || !isDesktop) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: strength,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, [strength]);

  return ref;
}
