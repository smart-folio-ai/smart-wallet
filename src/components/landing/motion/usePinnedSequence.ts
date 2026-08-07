import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {ensureScrollTrigger} from './useGsapReveal';

/**
 * Pina a coluna do mockup e troca os painéis conforme o scroll da seção.
 *
 * Só roda a partir de 1024px, via gsap.matchMedia: em telas menores não há
 * espaço lateral para o efeito, e a seção vira empilhamento simples. O
 * matchMedia do GSAP também cuida da limpeza ao sair da faixa.
 *
 * Contrato do DOM: o container precisa conter um `[data-pin-target]` (o que
 * fica preso) e `panelCount` elementos `[data-panel]` sobrepostos dentro dele.
 */
export function usePinnedSequence<T extends HTMLElement>(panelCount: number) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (!ensureScrollTrigger()) return;
    if (panelCount < 2) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
      },
      (context) => {
        if (!context.conditions?.isDesktop) return;

        const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', root);
        const pinTarget = root.querySelector<HTMLElement>('[data-pin-target]');
        if (!pinTarget || panels.length !== panelCount) return;

        gsap.set(panels, {opacity: 0, y: 24});
        gsap.set(panels[0], {opacity: 1, y: 0});

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top+=80',
            end: `+=${(panelCount - 1) * 70}%`,
            pin: pinTarget,
            pinSpacing: false,
            scrub: 0.6,
          },
        });

        panels.forEach((panel, index) => {
          if (index === 0) return;
          timeline
            .to(panels[index - 1], {opacity: 0, y: -24, duration: 0.4})
            .to(panel, {opacity: 1, y: 0, duration: 0.4}, '<');
        });
      },
    );

    return () => mm.revert();
  }, [panelCount]);

  return ref;
}
