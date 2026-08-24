import {Section} from '../ui/Section';
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
        <h2
          data-reveal
          className="font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          {productCopy.title}
        </h2>
        <p
          data-reveal
          data-reveal-delay="0.08"
          className="mt-5 text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
          {productCopy.subtitle}
        </p>
      </div>

      <div ref={rootRef} className="mt-16 lg:grid lg:grid-cols-2 lg:gap-16">
        {/* coluna de texto: rola normalmente. O espaçamento de 70vh existe
            só para dar "tempo de tela" ao pin do desktop; sem motion (ou
            sem o pin) ele vira vazio literal, então recolhe para o ritmo
            normal. */}
        <div className="space-y-16 lg:space-y-[70vh] motion-reduce:lg:space-y-16">
          {productCopy.blocks.map((block) => {
            const Mockup = mockupById[block.id];

            return (
              <div key={block.id}>
                <h3 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-on-surface">
                  {block.title}
                </h3>
                <p className="mt-4 max-w-lg text-[1.0625rem] leading-[1.7] text-on-surface-muted/60">
                  {block.description}
                </p>

                {/* Três estados: mobile mostra sempre; desktop com motion
                    esconde (a coluna pinada assume); desktop sem motion
                    (prefers-reduced-motion) volta a mostrar, porque o pin
                    nunca roda e os três mockups ficariam empilhados e
                    ilegíveis na coluna fixa abaixo. */}
                <div className="mt-8 lg:hidden motion-reduce:lg:block">
                  <Mockup />
                </div>
              </div>
            );
          })}
        </div>

        {/* coluna pinada: só desktop e só com motion permitido. Sob
            prefers-reduced-motion o usePinnedSequence nunca roda
            gsap.set(panels, {opacity: 0}), então os três painéis
            ficariam sobrepostos em um único box de 520px — por isso
            essa coluna é escondida explicitamente aqui via CSS. */}
        <div data-pin-target className="hidden lg:block motion-reduce:lg:hidden">
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
