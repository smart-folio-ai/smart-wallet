import {CtaSection} from '@/components/landing/CtaSection';
import {HeroSection} from '@/components/landing/HeroSection';
import {LandingFooter} from '@/components/landing/LandingFooter';
import {LandingNav} from '@/components/landing/LandingNav';
import {MarketTape} from '@/components/landing/sections/MarketTape';
import {PricingSection} from '@/components/landing/PricingSection';
import {ValueSection} from '@/components/landing/ValueSection';
import {WorkflowSection} from '@/components/landing/WorkflowSection';
import {useGsapReveal} from '@/components/landing/motion/useGsapReveal';

export default function Landing() {
  // Anima tudo que estiver marcado com [data-reveal] nas seções abaixo.
  const containerRef = useGsapReveal<HTMLDivElement>();

  return (
    <div
      ref={containerRef}
      className="min-h-screen font-body"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% -10%, hsl(var(--brand) / 0.14) 0%, transparent 60%), linear-gradient(180deg, hsl(var(--surface-base)) 0%, hsl(var(--surface-panel)) 100%)',
      }}>
      <LandingNav />

      <main>
        <HeroSection />
        <MarketTape />
        <WorkflowSection />
        <ValueSection />
        <PricingSection />
        <CtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
