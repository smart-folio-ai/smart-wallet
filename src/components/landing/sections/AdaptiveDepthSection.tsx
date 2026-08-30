import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Section} from '../ui/Section';
import {GlassPanel} from '../ui/GlassPanel';
import {adaptiveDepthCopy, type AdaptiveDepthLevelId} from '../landing-data';
import {cn} from '@/lib/utils';

export function AdaptiveDepthSection() {
  const [levelId, setLevelId] = useState<AdaptiveDepthLevelId>('intermediario');
  const level =
    adaptiveDepthCopy.levels.find((l) => l.id === levelId) ??
    adaptiveDepthCopy.levels[1];

  return (
    <Section id="profundidade">
      <div className="max-w-3xl">
        <h2
          data-reveal
          className="font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          {adaptiveDepthCopy.title}
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          {adaptiveDepthCopy.subtitle}
        </p>
      </div>

      <div data-reveal className="mt-10 flex flex-col items-center gap-8">
        <div className="inline-flex gap-1 rounded-lg border border-surface-hairline/[0.12] bg-surface-base p-1">
          {adaptiveDepthCopy.levels.map((l) => (
            <Button
              key={l.id}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setLevelId(l.id)}
              aria-pressed={l.id === levelId}
              className={cn(
                'rounded-md px-4 text-sm font-medium transition-colors',
                l.id === levelId
                  ? 'bg-brand/10 text-brand'
                  : 'text-on-surface-muted/60 hover:text-on-surface',
              )}>
              {l.label}
            </Button>
          ))}
        </div>

        <GlassPanel className="w-full max-w-md p-7 text-center">
          <p className="text-xs uppercase tracking-widest text-on-surface-muted/50">
            {level.metricLabel}
          </p>
          <p className="mt-2 font-heading text-3xl font-semibold text-on-surface">
            {level.metricValue}
          </p>
          <p className="mt-3 text-sm text-on-surface-muted/60">
            {level.metricNote}
          </p>
        </GlassPanel>
      </div>
    </Section>
  );
}

export default AdaptiveDepthSection;
