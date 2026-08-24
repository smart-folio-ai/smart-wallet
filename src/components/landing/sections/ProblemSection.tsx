import {Section} from '../ui/Section';
import {GlassPanel} from '../ui/GlassPanel';
import {problemCopy} from '../landing-data';

export function ProblemSection() {
  return (
    <Section id="problema">
      <div className="max-w-3xl">
        <h2
          data-reveal
          className="font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          <span className="block">{problemCopy.title}</span>
          <span className="block text-on-surface-muted/45">
            {problemCopy.titleAccent}
          </span>
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          {problemCopy.subtitle}
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {problemCopy.cards.map((card, index) => (
          <GlassPanel
            key={card.title}
            data-reveal
            data-reveal-delay={String(index * 0.1)}
            className="p-7">
            <h3 className="font-heading text-lg font-semibold leading-snug text-on-surface">
              {card.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-muted/60">
              {card.description}
            </p>
          </GlassPanel>
        ))}
      </div>
    </Section>
  );
}

export default ProblemSection;
