import {useState} from 'react';
import {ShowcaseVideo} from '../showcase/ShowcaseVideo';
import {LEVEL_VIEW, LEVELS, PRODUCT_BLOCKS, STEPS, TRUST, type LandingLevel} from './landing-content';

const EYEBROW: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-accent-300)',
};

const H2_BASE: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  color: 'var(--color-text)',
};

export function VideoSection() {
  return (
    <section
      id="veja-em-acao"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '64px 32px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
      <div style={EYEBROW}>Veja em ação</div>
      <h2 style={{...H2_BASE, fontSize: 30, letterSpacing: '-0.02em', margin: '11.2px 0 0', textWrap: 'pretty'}}>
        90 segundos para entender o Trackerr
      </h2>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 780,
          aspectRatio: '16/9',
          marginTop: 32,
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid var(--color-accent-700)',
          boxShadow: '0 28px 72px rgba(0,0,0,0.5)',
        }}>
        <ShowcaseVideo style={{position: 'absolute', inset: 0}} />
      </div>
    </section>
  );
}

export function ProductBlocksSection() {
  return (
    <section id="produto" style={{maxWidth: 1200, margin: '0 auto', padding: '80px 32px'}}>
      <div style={{maxWidth: 620}}>
        <div style={EYEBROW}>O produto · Platform</div>
        <h2 style={{...H2_BASE, fontSize: 36, letterSpacing: '-0.025em', lineHeight: 1.15, margin: '11.2px 0 0'}}>
          Três coisas que você para de fazer na mão
        </h2>
        <p style={{fontSize: 15, lineHeight: 1.6, color: 'var(--color-neutral-400)', margin: '16.8px 0 0'}}>
          Conecte uma vez. O acompanhamento passa a ser leitura, não digitação — e a profundidade acompanha o seu nível.
        </p>
      </div>
      <div
        className="tl-grid-3"
        style={{display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16.8, marginTop: 40}}>
        {PRODUCT_BLOCKS.map((b) => (
          <div
            key={b.title}
            className="tl-product-card"
            style={{
              border: '1px solid var(--hair)',
              borderRadius: 8,
              background: 'var(--nk-card)',
              padding: 22.4,
              display: 'flex',
              flexDirection: 'column',
              gap: 11.2,
            }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                border: '1px solid rgba(152,160,171,0.30)',
                background: 'rgba(var(--rgb-accent-deep),0.30)',
                display: 'grid',
                placeItems: 'center',
              }}>
              <i className={b.icon} style={{fontSize: 17, color: 'var(--color-accent-300)'}} />
            </div>
            <div style={{...H2_BASE, fontSize: 17, letterSpacing: '-0.01em'}}>{b.title}</div>
            <div style={{fontSize: 13.5, lineHeight: 1.6, color: 'var(--color-neutral-400)'}}>{b.body}</div>
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 11.2,
                borderTop: '1px solid var(--hair-soft)',
                fontSize: 11.5,
                color: 'var(--color-neutral-600)',
                fontVariantNumeric: 'tabular-nums',
              }}>
              {b.proof}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const segStyle = (active: boolean): React.CSSProperties => ({
  height: 30,
  padding: '0 14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  fontWeight: 500,
  transition: 'all .15s ease',
  ...(active
    ? {
        background: 'rgba(152,160,171,0.20)',
        color: 'var(--color-accent-200)',
        boxShadow: 'inset 0 0 0 1px rgba(152,160,171,0.45)',
      }
    : {background: 'transparent', color: 'var(--color-neutral-500)'}),
});

export function AdaptiveDepthSection() {
  const [level, setLevel] = useState<LandingLevel>('avancado');
  const view = LEVEL_VIEW[level];

  return (
    <section
      id="profundidade"
      style={{
        borderTop: '1px solid var(--hair-soft)',
        borderBottom: '1px solid var(--hair-soft)',
        background: 'linear-gradient(180deg, rgba(var(--rgb-section),0.30), rgba(var(--rgb-bg),0))',
      }}>
      <div
        className="tl-grid-2"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '72px 32px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
          gap: 56,
          alignItems: 'center',
        }}>
        <div>
          <div style={EYEBROW}>Perfil adaptativo · Adaptive depth</div>
          <h2 style={{...H2_BASE, fontSize: 34, letterSpacing: '-0.025em', lineHeight: 1.18, margin: '11.2px 0 0'}}>
            A mesma carteira, na profundidade que você entende
          </h2>
          <p style={{fontSize: 15, lineHeight: 1.6, color: 'var(--color-neutral-400)', margin: '16.8px 0 0'}}>
            A IA sugere o seu nível a partir de como você usa a plataforma — e você muda quando quiser, sem perder nada.
            Nada é escondido: o que muda é quanto de contexto vem junto.
          </p>
          <div
            role="group"
            aria-label="Nível de investidor"
            style={{
              display: 'flex',
              padding: 2.8,
              gap: 2.8,
              border: '1px solid var(--hair)',
              borderRadius: 8,
              background: 'rgba(var(--rgb-bg),0.7)',
              marginTop: 22.4,
              width: 'fit-content',
            }}>
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={level === l.id}
                onClick={() => setLevel(l.id)}
                style={segStyle(level === l.id)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--nk-card)',
            boxShadow: '0 20px 56px rgba(0,0,0,0.45)',
            overflow: 'hidden',
          }}>
          <div
            style={{
              padding: '12px 16.8px',
              borderBottom: '1px solid var(--hair-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)'}}>{view.title}</div>
            <div style={{fontSize: 10.5, color: 'var(--color-accent-300)', display: 'flex', alignItems: 'center', gap: 4}}>
              <i className="ph-fill ph-sparkle" style={{fontSize: 12}} />
              {view.tag}
            </div>
          </div>
          <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 11.2}}>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8.4}}>
              {view.metrics.map((m) => (
                <div
                  key={m.label}
                  style={{
                    border: '1px solid var(--hair-soft)',
                    borderRadius: 8,
                    padding: 11.2,
                    background: 'rgba(var(--rgb-bg),0.5)',
                  }}>
                  <div
                    style={{
                      fontSize: 9.5,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-neutral-600)',
                    }}>
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      marginTop: 5.6,
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--color-text)',
                    }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8.4,
                padding: 11.2,
                border: '1px solid rgba(152,160,171,0.24)',
                borderRadius: 8,
                background: 'rgba(var(--rgb-accent-deep),0.22)',
              }}>
              <i className="ph-fill ph-sparkle" style={{fontSize: 14, color: 'var(--color-accent-300)', marginTop: 1}} />
              <div style={{fontSize: 12.5, lineHeight: 1.55, color: 'var(--color-neutral-300)'}}>{view.insight}</div>
            </div>
            <div style={{fontSize: 11, color: 'var(--color-neutral-600)'}}>{view.footer}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="como-funciona" style={{maxWidth: 1200, margin: '0 auto', padding: '80px 32px'}}>
      <div style={EYEBROW}>Como funciona · Onboarding</div>
      <h2 style={{...H2_BASE, fontSize: 36, letterSpacing: '-0.025em', margin: '11.2px 0 40px'}}>
        Do extrato à decisão em três passos
      </h2>
      <div
        className="tl-grid-3"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 1,
          border: '1px solid var(--hair)',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--hair-soft)',
        }}>
        {STEPS.map((s) => (
          <div
            key={s.step}
            style={{
              padding: '28px 22.4px',
              background: 'var(--surf-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8.4,
            }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 28,
                fontWeight: 600,
                color: 'var(--color-accent-700)',
              }}>
              {s.step}
            </div>
            <div style={{fontSize: 16, fontWeight: 600, color: 'var(--color-text)'}}>{s.title}</div>
            <div style={{fontSize: 13.5, lineHeight: 1.6, color: 'var(--color-neutral-400)'}}>{s.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrustSection() {
  return (
    <section id="seguranca" style={{borderTop: '1px solid var(--hair-soft)', background: 'rgba(var(--rgb-bg),0.6)'}}>
      <div
        className="tl-grid-2"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '56px 32px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
          gap: 40,
          alignItems: 'center',
        }}>
        <div>
          <div style={EYEBROW}>Confiança · Trust</div>
          <h2 style={{...H2_BASE, fontSize: 26, letterSpacing: '-0.02em', margin: '11.2px 0 0', lineHeight: 1.25}}>
            Infraestrutura de nível institucional
          </h2>
        </div>
        <div
          className="tl-grid-4"
          style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16.8}}>
          {TRUST.map((t) => (
            <div key={t.value} style={{borderLeft: '1px solid var(--hair)', paddingLeft: 16.8}}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 17,
                  fontWeight: 600,
                  color: 'var(--color-neutral-100)',
                }}>
                {t.value}
              </div>
              <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 4, lineHeight: 1.4}}>
                {t.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
