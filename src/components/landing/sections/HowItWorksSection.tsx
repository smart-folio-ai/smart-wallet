import {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {Section} from '../ui/Section';
import {workflowSteps} from '../landing-data';
import {ensureScrollTrigger} from '../motion/useGsapReveal';

export function HowItWorksSection() {
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (!ensureScrollTrigger()) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        rail,
        {scaleX: 0, transformOrigin: 'left center'},
        {
          scaleX: 1,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {trigger: rail, start: 'top 85%', once: true},
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <Section id="como-funciona">
      <div className="max-w-2xl">
        <h2
          data-reveal
          className="font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          Do extrato à decisão em três passos
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.08"
          className="mt-5 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          Você conecta uma vez. O resto é acompanhamento.
        </p>
      </div>

      <ol className="relative mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
        <div
          ref={railRef}
          aria-hidden="true"
          className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-transparent via-surface-hairline/[0.12] to-transparent md:block"
        />

        {workflowSteps.map((item, index) => (
          <li
            key={item.step}
            data-reveal
            data-reveal-delay={String(index * 0.12)}
            className="relative">
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-surface-hairline/[0.1] bg-surface-panel font-heading text-xs font-semibold tabular-nums text-on-surface-muted/70">
              {item.step}
            </div>
            <h3 className="mt-6 font-heading text-lg font-semibold text-on-surface">
              {item.title}
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-on-surface-muted/60">
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export default HowItWorksSection;
