import {HERO_KPIS, HERO_SERIES, MICRO_PROOF, TAPE} from './landing-content';

function HeroChart() {
  const w = 420;
  const h = 96;
  const pad = 4;
  const min = 96;
  const max = 132;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (HERO_SERIES.length - 1);
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  const d = HERO_SERIES.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width: '100%', height: 'auto', display: 'block'}} aria-hidden="true">
      <defs>
        <linearGradient id="tkHeroFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ac)" stopOpacity={0.32} />
          <stop offset="100%" stopColor="var(--ac)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${d} L${w - pad} ${h - pad} L${pad} ${h - pad} Z`} fill="url(#tkHeroFill)" />
      <path d={d} fill="none" stroke="var(--ac-soft)" strokeWidth={2.75} strokeLinejoin="round" />
    </svg>
  );
}

export function HeroSection() {
  const tape = [...TAPE, ...TAPE];

  return (
    <section
      id="inicio"
      style={{
        position: 'relative',
        background:
          'radial-gradient(1200px 620px at 18% -14%, var(--neb-1) 0%, rgba(var(--rgb-accent-deep),0) 62%), radial-gradient(1000px 560px at 86% -4%, var(--neb-2) 0%, rgba(35,39,82,0) 58%), var(--color-bg)',
        borderBottom: '1px solid var(--hair-soft)',
      }}>
      <div
        className="tl-grid-2"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '88px 32px 72px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
          gap: 56,
          alignItems: 'center',
        }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8.4,
              border: '1px solid rgba(152,160,171,0.32)',
              borderRadius: 8,
              padding: '5.6px 11.2px',
              background: 'rgba(var(--rgb-accent-deep),0.28)',
              fontSize: 11.5,
              color: 'var(--color-accent-200)',
              letterSpacing: '0.02em',
            }}>
            <i className="ph-fill ph-sparkle" style={{fontSize: 13}} />
            <span>Copiloto de investimentos · AI-native</span>
          </div>
          <h1
            className="tl-h1"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 56,
              lineHeight: 1.04,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              margin: '22.4px 0 0',
              textWrap: 'pretty',
              color: 'var(--color-text)',
            }}>
            Sua carteira inteira,
            <br />
            <span style={{color: 'var(--color-accent-300)'}}>lida por uma IA que explica o porquê.</span>
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: 'var(--color-neutral-400)',
              maxWidth: 520,
              margin: '22.4px 0 0',
              textWrap: 'pretty',
            }}>
            O Trackerr consolida ativos de todas as corretoras, calcula o seu imposto e mostra o que exige atenção agora
            — com a profundidade certa para o seu nível de investidor, do essencial ao quantitativo.
          </p>
          <div style={{display: 'flex', gap: 11.2, marginTop: 28, flexWrap: 'wrap'}}>
            <a
              href="#planos"
              className="tl-cta-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8.4,
                height: 44,
                padding: '0 22.4px',
                border: '1px solid var(--color-accent)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                boxShadow: '0 0 32px rgba(152,160,171,0.18)',
              }}>
              Começar agora
              <i className="ph ph-arrow-right" style={{fontSize: 14}} />
            </a>
            <a
              href="#veja-em-acao"
              className="tl-cta-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8.4,
                height: 44,
                padding: '0 22.4px',
                border: '1px solid var(--hair)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
              }}>
              <i className="ph ph-play-circle" style={{fontSize: 15}} />
              Ver o produto em 90s
            </a>
          </div>
          <div style={{display: 'flex', gap: 22.4, marginTop: 28, flexWrap: 'wrap'}}>
            {MICRO_PROOF.map((label) => (
              <div
                key={label}
                style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 12, color: 'var(--color-neutral-500)'}}>
                <i className="ph ph-check-circle" style={{fontSize: 14, color: 'var(--pos)'}} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          aria-label="Exemplo ilustrativo da carteira consolidada"
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--nk-card)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
            overflow: 'hidden',
          }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16.8px',
              borderBottom: '1px solid var(--hair-soft)',
            }}>
            <div>
              <div style={{fontSize: 13, fontWeight: 600, color: 'var(--color-text)'}}>Carteira consolidada</div>
              <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>
                3 corretoras · atualizado agora
              </div>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 10.5, color: 'var(--pos)'}}>
              <span style={{width: 6, height: 6, borderRadius: '50%', background: 'var(--pos)'}} />
              <span>ao vivo</span>
            </div>
          </div>
          <div style={{padding: 16.8}}>
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-neutral-600)',
              }}>
              Patrimônio
            </div>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 11.2, marginTop: 5.6}}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--color-text)',
                }}>
                R$ 1.284.930
              </div>
              <div style={{fontSize: 13, fontWeight: 600, color: 'var(--pos)'}}>+17,1%</div>
            </div>
            <div style={{marginTop: 16.8}}>
              <HeroChart />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
                marginTop: 16.8,
                border: '1px solid var(--hair-soft)',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'var(--hair-soft)',
              }}>
              {HERO_KPIS.map((k) => (
                <div key={k.label} style={{padding: 11.2, background: 'var(--surf-3)'}}>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--color-neutral-600)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>
                    {k.label}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--pos)',
                      marginTop: 4,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                    {k.value}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8.4,
                marginTop: 16.8,
                padding: 11.2,
                border: '1px solid rgba(152,160,171,0.28)',
                borderRadius: 8,
                background: 'linear-gradient(100deg, rgba(var(--rgb-accent-deep),0.40), rgba(var(--rgb-surf),0.25))',
              }}>
              <i className="ph-fill ph-sparkle" style={{fontSize: 14, color: 'var(--color-accent-300)', marginTop: 1}} />
              <div>
                <div style={{fontSize: 12, fontWeight: 600, color: 'var(--color-neutral-100)'}}>
                  PETR4 concentra 19,4% do seu VaR
                </div>
                <div style={{fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 3, lineHeight: 1.45}}>
                  Reduzir a 7% derruba o VaR 95% para R$ 35,8k · confiança 92% · 5 fontes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        style={{
          borderTop: '1px solid var(--hair-soft)',
          overflow: 'hidden',
          padding: '11.2px 0',
          background: 'rgba(var(--rgb-bg),0.5)',
        }}>
        <div className="tl-tape-track" style={{display: 'flex', width: '200%', gap: 32}}>
          {tape.map((t, index) => (
            <div
              key={`${t.symbol}-${index}`}
              style={{display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 12, whiteSpace: 'nowrap'}}>
              <span style={{fontWeight: 600, color: 'var(--color-neutral-300)'}}>{t.symbol}</span>
              <span style={{color: 'var(--color-neutral-500)', fontVariantNumeric: 'tabular-nums'}}>{t.price}</span>
              <span
                style={{
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: t.up ? 'var(--pos)' : 'var(--neg)',
                }}>
                {t.change}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
