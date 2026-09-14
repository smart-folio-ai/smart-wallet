import {useEffect, useState} from 'react';
import {captureAttribution} from '@/utils/attribution';
import {LandingNav} from '@/components/landing/sections/LandingNav';
import type {LandingTheme} from '@/components/landing/sections/LandingNav';
import {HeroSection} from '@/components/landing/sections/HeroSection';
import {MarketTape} from '@/components/landing/sections/MarketTape';
import {ProblemSection} from '@/components/landing/sections/ProblemSection';
import {ProductSection} from '@/components/landing/sections/ProductSection';
import {HowItWorksSection} from '@/components/landing/sections/HowItWorksSection';
import {TrustSection} from '@/components/landing/sections/TrustSection';
import {AdaptiveDepthSection} from '@/components/landing/sections/AdaptiveDepthSection';
import {PricingSection} from '@/components/landing/sections/PricingSection';
import {FaqSection} from '@/components/landing/sections/FaqSection';
import {FinalCtaSection} from '@/components/landing/sections/FinalCtaSection';
import {LandingFooter} from '@/components/landing/sections/LandingFooter';
import {useGsapReveal} from '@/components/landing/motion/useGsapReveal';

const LANDING_THEME_STORAGE_KEY = 'landing-theme';

function getInitialLandingTheme(): LandingTheme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(LANDING_THEME_STORAGE_KEY);
  return saved === 'light' ? 'light' : 'dark';
}

/**
 * A landing tem tema próprio (default escuro), independente do tema salvo
 * pelo app autenticado — handoff especifica um toggle sol/lua no header
 * público (Trackerr Landing.dc.html).
 *
 * O toggle não pode ser só uma classe local no wrapper: `--surface-base`,
 * `--brand` etc são declarados em `:root`/`.dark` (ambos casam com <html>,
 * já que `:root` === `html`), e como CSS custom property herdada só é
 * sobrescrita por uma regra que casa com o PRÓPRIO elemento, tirar a classe
 * "dark" de um div filho não desfaz o que `<html class="dark">` já
 * estabeleceu quando o tema global do app está em dark — o valor herdado
 * continua vencendo. Por isso o toggle da Landing aplica a classe
 * diretamente em `document.documentElement`, no mesmo nível de `:root`/
 * `.dark`, restaurando o que estava lá ao desmontar para não vazar pro
 * resto do app.
 */
export default function Landing() {
  const containerRef = useGsapReveal<HTMLDivElement>();
  const [theme, setTheme] = useState<LandingTheme>(getInitialLandingTheme);

  useEffect(() => {
    captureAttribution(window.location.search);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const hadDarkBeforeLanding = root.classList.contains('dark');

    root.classList.toggle('dark', theme === 'dark');

    return () => {
      root.classList.toggle('dark', hadDarkBeforeLanding);
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(LANDING_THEME_STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-surface font-body">
      <LandingNav theme={theme} onToggleTheme={toggleTheme} />

      <main>
        <HeroSection />
        <MarketTape />
        <ProblemSection />
        <ProductSection />
        <HowItWorksSection />
        <TrustSection />
        <AdaptiveDepthSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>

      <LandingFooter />
    </div>
  );
}
