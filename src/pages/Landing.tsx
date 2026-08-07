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
 * A classe .landing-root escopa as superfícies escurecidas do redesign.
 * Sem ela, a landing herdaria os tokens globais — que continuam servindo as
 * páginas de autenticação e não devem mudar nesta etapa.
 */
export default function Landing() {
  const containerRef = useGsapReveal<HTMLDivElement>();

  return (
    <div ref={containerRef} className="landing-root min-h-screen font-body">
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
