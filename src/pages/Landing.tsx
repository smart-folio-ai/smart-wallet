import {useEffect, useState} from 'react';
import {captureAttribution} from '@/utils/attribution';
import {LandingHeader, type LandingTheme} from '@/components/landing/handoff/LandingHeader';
import {HeroSection} from '@/components/landing/handoff/HeroSection';
import {
  AdaptiveDepthSection,
  HowItWorksSection,
  ProductBlocksSection,
  TrustSection,
  VideoSection,
} from '@/components/landing/handoff/ProductSections';
import {
  FaqSection,
  FinalCtaSection,
  LandingFooter,
  PlansSection,
} from '@/components/landing/handoff/ConversionSections';
import type {LandingLang} from '@/components/landing/handoff/landing-content';
import '@/components/landing/handoff/landing-handoff.css';

const LANDING_THEME_STORAGE_KEY = 'landing-theme';
const LANDING_LANG_STORAGE_KEY = 'landing-lang';

function readStored<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key) as T | null;
    return saved && allowed.includes(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Landing — design_handoff_trackerr/Trackerr Landing.dc.html.
 *
 * O toggle aplica a classe em `document.documentElement`, no mesmo nível de
 * `:root`/`.dark`: tirar "dark" só de um wrapper não desfaz um
 * `<html class="dark">` herdado do tema do app. Restaura o valor anterior ao
 * desmontar para não vazar tema para o resto do app.
 *
 * O seletor PT/EN/ES do handoff troca só o rótulo ativo (README do handoff:
 * conteúdo em EN/ES ainda não traduzido).
 */
export default function Landing() {
  const [theme, setTheme] = useState<LandingTheme>(() =>
    readStored<LandingTheme>(LANDING_THEME_STORAGE_KEY, ['light', 'dark'], 'dark'),
  );
  const [lang, setLang] = useState<LandingLang>(() =>
    readStored<LandingLang>(LANDING_LANG_STORAGE_KEY, ['pt', 'en', 'es'], 'pt'),
  );

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
      try {
        localStorage.setItem(LANDING_THEME_STORAGE_KEY, next);
      } catch {
        // sem armazenamento (aba privada): vale só nesta visita
      }
      return next;
    });
  };

  const changeLang = (next: LandingLang) => {
    setLang(next);
    try {
      localStorage.setItem(LANDING_LANG_STORAGE_KEY, next);
    } catch {
      // idem
    }
  };

  return (
    <div
      className="tl-root"
      style={{
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        overflowX: 'hidden',
        minHeight: '100vh',
        WebkitFontSmoothing: 'antialiased',
      }}>
      <LandingHeader theme={theme} onToggleTheme={toggleTheme} lang={lang} onChangeLang={changeLang} />
      <main>
        <HeroSection />
        <VideoSection />
        <ProductBlocksSection />
        <AdaptiveDepthSection />
        <HowItWorksSection />
        <TrustSection />
        <PlansSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
