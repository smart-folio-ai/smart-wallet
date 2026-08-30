import {Link} from 'react-router-dom';
import {ArrowRight, Check} from '@/components/ui/icons';
import {Button} from '@/components/ui/button';
import {Section} from '../ui/Section';
import {GridBackdrop} from '../ui/GridBackdrop';
import {finalCtaCopy} from '../landing-data';
import {useMagnetic} from '../motion/useMagnetic';

export function FinalCtaSection() {
  const ctaRef = useMagnetic<HTMLAnchorElement>(0.2);

  return (
    <Section>
      <div
        data-reveal
        className="relative overflow-hidden rounded-3xl border border-surface-hairline/[0.08] px-8 py-20 text-center"
        style={{
          background:
            'linear-gradient(160deg, hsl(var(--brand) / 0.12) 0%, hsl(var(--surface-panel)) 60%)',
        }}>
        <GridBackdrop />

        <h2 className="relative mx-auto max-w-2xl font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          {finalCtaCopy.title}
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-[1.0625rem] leading-[1.7] text-on-surface-muted/65">
          {finalCtaCopy.subtitle}
        </p>

        <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="group border border-brand bg-transparent text-brand hover:bg-brand/10 transition-colors">
            <Link ref={ctaRef} to="/register">
              Criar conta gratuita
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-surface-hairline/[0.12] bg-transparent text-on-surface hover:bg-surface-hairline/[0.06] hover:text-on-surface">
            <Link to="/signin">Entrar</Link>
          </Button>
        </div>

        <ul className="relative mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
          {finalCtaCopy.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-center gap-2 text-sm text-on-surface-muted/55">
              <Check className="h-4 w-4 text-positive" />
              {bullet}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export default FinalCtaSection;
