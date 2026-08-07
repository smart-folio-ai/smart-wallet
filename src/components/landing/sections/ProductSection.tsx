import {Section} from '../ui/Section';
import {Eyebrow} from '../ui/Eyebrow';
import {PortfolioMockup} from '../mockups/PortfolioMockup';
import {AiAlertMockup} from '../mockups/AiAlertMockup';
import {TaxMockup} from '../mockups/TaxMockup';
import {productCopy} from '../landing-data';
import {usePinnedSequence} from '../motion/usePinnedSequence';

const mockupById = {
  carteira: PortfolioMockup,
  ia: AiAlertMockup,
  fiscal: TaxMockup,
};

export function ProductSection() {
  const rootRef = usePinnedSequence<HTMLDivElement>(productCopy.blocks.length);

  return (
    <Section id="produto">
      <div className="max-w-2xl">
        <div data-reveal>
          <Eyebrow>{productCopy.eyebrow}</Eyebrow>
        </div>
        <h2
          data-reveal
          data-reveal-delay="0.08"
          className="mt-6 font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          {productCopy.title}
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.14"
          className="mt-5 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          {productCopy.subtitle}
        </p>
      </div>

      <div ref={rootRef} className="mt-16 lg:grid lg:grid-cols-2 lg:gap-16">
        {/* coluna de texto: rola normalmente */}
        <div className="space-y-16 lg:space-y-[70vh]">
          {productCopy.blocks.map((block, index) => {
            const Mockup = mockupById[block.id];

            return (
              <div key={block.id}>
                <div className="flex items-baseline gap-4">
                  <span className="font-heading text-sm tabular-nums text-on-surface-muted/30">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-on-surface">
                    {block.title}
                  </h3>
                </div>
                <p className="mt-4 max-w-lg text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
                  {block.description}
                </p>

                {/* Em mobile o mockup acompanha seu texto. Escondido no
                    desktop, onde a coluna pinada assume. */}
                <div className="mt-8 lg:hidden">
                  <Mockup />
                </div>
              </div>
            );
          })}
        </div>

        {/* coluna pinada: só desktop */}
        <div data-pin-target className="hidden lg:block">
          <div className="relative h-[520px]">
            {productCopy.blocks.map((block) => {
              const Mockup = mockupById[block.id];
              return (
                <div key={block.id} data-panel className="absolute inset-x-0 top-0">
                  <Mockup />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}

export default ProductSection;
