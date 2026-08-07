import {useEffect, useRef} from 'react';
import gsap from 'gsap';

/**
 * Hover magnético: o elemento acompanha levemente o cursor e volta ao centro
 * na saída. Só desktop — em touch não há cursor e o efeito só atrapalha.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.25) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
      return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    const ctx = gsap.context(() => {
      const onMove = (event: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - (rect.left + rect.width / 2);
        const y = event.clientY - (rect.top + rect.height / 2);

        gsap.to(el, {
          x: x * strength,
          y: y * strength,
          duration: 0.4,
          ease: 'power3.out',
        });
      };

      const onLeave = () => {
        gsap.to(el, {x: 0, y: 0, duration: 0.5, ease: 'power3.out'});
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);

      return () => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      };
    }, el);

    return () => ctx.revert();
  }, [strength]);

  return ref;
}
