import {Section} from '../ui/Section';
import {trustStats} from '../landing-data';

export function TrustSection() {
  return (
    <Section id="seguranca" className="py-16 sm:py-20">
      <div
        data-reveal
        className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-surface-hairline/[0.07] bg-surface-hairline/[0.07] lg:grid-cols-4">
        {trustStats.map((stat) => (
          <div key={stat.label} className="bg-surface-base px-6 py-8">
            <p className="font-heading text-xl font-semibold text-on-surface">
              {stat.value}
            </p>
            <p className="mt-1.5 text-xs text-on-surface-muted/50">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default TrustSection;
