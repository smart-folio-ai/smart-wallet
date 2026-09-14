import {Link} from 'react-router-dom';
import {TrackerrMark} from './TrackerrMark';
import {LANGS, NAV_LINKS, type LandingLang} from './landing-content';

export type LandingTheme = 'light' | 'dark';

interface LandingHeaderProps {
  theme: LandingTheme;
  onToggleTheme: () => void;
  lang: LandingLang;
  onChangeLang: (lang: LandingLang) => void;
}

const langStyle = (active: boolean): React.CSSProperties => ({
  height: 24,
  padding: '0 8px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.02em',
  transition: 'all .15s ease',
  background: active ? 'rgba(152,160,171,0.20)' : 'transparent',
  color: active ? 'var(--color-accent-200)' : 'var(--color-neutral-500)',
});

export function LandingHeader({theme, onToggleTheme, lang, onChangeLang}: LandingHeaderProps) {
  const themeLabel = theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--hair-soft)',
        background: 'rgba(var(--rgb-bg),0.82)',
        backdropFilter: 'blur(14px)',
      }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 32,
        }}>
        <Link to="/" style={{display: 'flex', alignItems: 'center', gap: 8.4, color: 'var(--color-text)'}}>
          <TrackerrMark />
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: '-0.015em',
              color: 'var(--color-text)',
            }}>
            Trackerr
          </span>
        </Link>
        <nav className="tl-hide-md" style={{display: 'flex', gap: 22.4, fontSize: 13}}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="tl-nav-link">
              {link.label}
            </a>
          ))}
        </nav>
        <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 11.2}}>
          <button
            type="button"
            onClick={onToggleTheme}
            title={themeLabel}
            aria-label={themeLabel}
            className="tl-theme-btn"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--hair)',
              background: 'transparent',
              color: 'var(--color-neutral-400)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}>
            <i className={theme === 'light' ? 'ph ph-moon' : 'ph ph-sun'} style={{fontSize: 15}} />
          </button>
          <div
            className="tl-hide-md"
            role="group"
            aria-label="Idioma"
            style={{
              display: 'flex',
              gap: 2,
              padding: 2,
              border: '1px solid var(--hair)',
              borderRadius: 8,
              background: 'rgba(var(--rgb-bg),0.6)',
            }}>
            {LANGS.map((item) => (
              <button
                key={item.code}
                type="button"
                title={item.title}
                aria-pressed={lang === item.code}
                onClick={() => onChangeLang(item.code)}
                style={langStyle(lang === item.code)}>
                {item.code.toUpperCase()}
              </button>
            ))}
          </div>
          <Link to="/signin" className="tl-signin" style={{fontSize: 13}}>
            Entrar
          </Link>
          <a
            href="#planos"
            className="tl-cta-header tl-hide-md"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5.6,
              height: 34,
              padding: '0 16.8px',
              border: '1px solid var(--color-accent)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
            }}>
            Falar com especialista
            <i className="ph ph-arrow-up-right" style={{fontSize: 13}} />
          </a>
        </div>
      </div>
    </header>
  );
}
