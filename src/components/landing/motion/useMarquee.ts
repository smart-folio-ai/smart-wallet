import {useEffect, useRef} from 'react';
import gsap from 'gsap';

/**
 * Loop horizontal infinito.
 *
 * O truque está no `modifiers`: em vez de animar até -50% e reiniciar (o que
 * produz um salto de um frame), o x é envolvido em módulo da metade da largura,
 * então o trilho nunca "volta" — ele só continua. A lista precisa estar
 * duplicada no DOM para isso funcionar.
 */
export function useMarquee<T extends HTMLElement>(speed = 60) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const half = el.scrollWidth / 2;
    if (!half) return;

    const ctx = gsap.context(() => {
      const wrap = gsap.utils.wrap(-half, 0);
      const tween = gsap.to(el, {
        x: `-=${half}`,
        duration: half / speed,
        ease: 'none',
        repeat: -1,
        modifiers: {
          x: (value) => `${wrap(parseFloat(value))}px`,
        },
      });

      const pause = () => tween.pause();
      const resume = () => tween.resume();

      el.addEventListener('mouseenter', pause);
      el.addEventListener('mouseleave', resume);

      return () => {
        el.removeEventListener('mouseenter', pause);
        el.removeEventListener('mouseleave', resume);
      };
    }, el);

    return () => ctx.revert();
  }, [speed]);

  return ref;
}
