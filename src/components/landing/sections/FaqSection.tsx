import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {Section} from '../ui/Section';
import {faqItems} from '../landing-data';

export function FaqSection() {
  return (
    <Section id="faq" containerClassName="max-w-3xl">
      <div className="text-center">
        <h2
          data-reveal
          className="font-heading font-bold tracking-[-0.03em] text-on-surface [font-size:clamp(1.875rem,3.5vw,3rem)] [line-height:1.08]">
          O que costumam perguntar antes de assinar
        </h2>
      </div>

      <Accordion
        type="single"
        collapsible
        data-reveal
        data-reveal-delay="0.14"
        className="mt-12">
        {faqItems.map((item) => (
          <AccordionItem
            key={item.question}
            value={item.question}
            className="border-surface-hairline/[0.07]">
            <AccordionTrigger className="text-left font-heading text-base font-medium text-on-surface hover:no-underline">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-[0.9375rem] leading-[1.7] text-on-surface-muted/60">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

export default FaqSection;
