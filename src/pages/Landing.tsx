import {useEffect} from 'react';
import {captureAttribution} from '@/utils/attribution';
import {LandingNav} from '@/components/landing/sections/LandingNav';
import {HeroSection} from '@/components/landing/sections/HeroSection';
import {MarketTape} from '@/components/landing/sections/MarketTape';
import {ProblemSection} from '@/components/landing/sections/ProblemSection';
import {ProductSection} from '@/components/landing/sections/ProductSection';
import {HowItWorksSection} from '@/components/landing/sections/HowItWorksSection';
import {TrustSection} from '@/components/landing/sections/TrustSection';
import {PricingSection} from '@/components/landing/sections/PricingSection';
import {FaqSection} from '@/components/landing/sections/FaqSection';
import {FinalCtaSection} from '@/components/landing/sections/FinalCtaSection';
import {LandingFooter} from '@/components/landing/sections/LandingFooter';
import {useGsapReveal} from '@/components/landing/motion/useGsapReveal';

/**
 * A classe `dark` mantém a landing escura independentemente do tema escolhido
 * no app. Antes isso era feito por um escopo próprio (.landing-root) que
 * redefinia as superfícies; agora "escuro" é um tema global e a landing apenas
 * o declara.
 */
export default function Landing() {
  const containerRef = useGsapReveal<HTMLDivElement>();

  useEffect(() => {
    captureAttribution(window.location.search);
  }, []);

  return (
    <div ref={containerRef} className="dark min-h-screen bg-surface font-body">
      <LandingNav />

      <main>
        <HeroSection />
        <MarketTape />
        <ProblemSection />
        <ProductSection />
        <HowItWorksSection />
        <TrustSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
