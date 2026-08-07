import {useEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {ensureScrollTrigger} from './useGsapReveal';

/**
 * Conta de 0 até `value` quando o elemento entra na viewport.
 *
 * O elemento já é renderizado com o valor final pelo React; este hook só
 * toca o textContent depois que o ScrollTrigger dispara. Consequência
 * deliberada: sem motion, sem viewport ou fora do browser, o número correto
 * já está na tela — nunca exibimos "0" como estado permanente.
 */
export function useCountUp(
  ref: React.RefObject<HTMLElement>,
  value: number,
  format: (n: number) => string,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!ensureScrollTrigger()) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const counter = {n: 0};

      gsap.to(counter, {
        n: value,
        duration: 1.4,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = format(counter.n);
        },
        onComplete: () => {
          el.textContent = format(value);
        },
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            el.textContent = format(0);
          },
        },
      });
    });

    return () => {
      ctx.revert();
      el.textContent = format(value);
    };
  }, [ref, value, format]);
}

// Referenciado para o bundler não remover o plugin em tree-shaking agressivo.
void ScrollTrigger;
