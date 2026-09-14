import type {CSSProperties} from 'react';
import {
  ADAPTIVE_LEVELS,
  useAdaptiveLevel,
  type AdaptiveLevel,
} from '@/contexts/AdaptiveLevelContext';

const LEVEL_COPY: Record<AdaptiveLevel, {label: string; description: string}> = {
  iniciante: {
    label: 'Iniciante',
    description:
      'Você vê o essencial em linguagem comum: quanto tem, quanto rendeu, quanto recebeu e o que exige atenção. Métricas de risco ficam disponíveis, mas fora do caminho.',
  },
  intermediario: {
    label: 'Intermediário',
    description:
      'Você vê comparativos com índices, atribuição de retorno e impacto fiscal junto dos números principais, com jargão sempre explicado.',
  },
  avancado: {
    label: 'Avançado',
    description:
      'Você vê o conjunto completo: VaR, Sharpe, beta, tracking error, contribuição de risco e a trilha de auditoria de cada insight da IA.',
  },
};

const segmentStyle = (active: boolean): CSSProperties => ({
  height: 24,
  padding: '0 10px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontSize: 11.5,
  fontWeight: 500,
  fontFamily: 'var(--font-body)',
  transition: 'all .15s ease',
  ...(active
    ? {
        background: 'rgba(152,160,171,0.20)',
        color: 'var(--color-accent-200)',
        boxShadow: 'inset 0 0 0 1px rgba(152,160,171,0.45)',
      }
    : {background: 'transparent', color: 'var(--color-neutral-500)'}),
});

function sourceLabel({
  isLoading,
  hasProfile,
  isOverride,
  signalCount,
}: {
  isLoading: boolean;
  hasProfile: boolean;
  isOverride: boolean;
  signalCount: number;
}): string {
  if (!hasProfile) return isLoading ? 'Carregando…' : 'Perfil indisponível';
  if (isOverride) return 'Você · nível fixado';
  return `IA · ${signalCount} ${signalCount === 1 ? 'sinal' : 'sinais'} de uso`;
}

export function InvestorProfileCard() {
  const {level, setLevel, clearOverride, profile, source, isLoading} =
    useAdaptiveLevel();

  const isOverride = source === 'user_override';
  const signalCount = profile ? Object.keys(profile.signals ?? {}).length : 0;

  return (
    <section
      aria-labelledby="investor-profile-title"
      style={{
        position: 'relative',
        border: '1px solid rgba(152,160,171,0.30)',
        borderRadius: 8,
        overflow: 'hidden',
        background:
          'linear-gradient(118deg, rgba(123,130,144,0.36) 0%, rgba(76,201,240,0.12) 55%, rgba(var(--rgb-surf-2),0.9) 100%), var(--surf-2)',
      }}>
      <div style={{padding: 22.4}}>
        <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16.8, flexWrap: 'wrap'}}>
          <div>
            <div style={{fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-accent-200)'}}>
              Perfil de investidor
            </div>
            <h2
              id="investor-profile-title"
              style={{fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', margin: '8.4px 0 0'}}>
              {LEVEL_COPY[level].label}
            </h2>
            <p style={{fontSize: 12.5, color: 'var(--color-neutral-400)', margin: '5.6px 0 0', maxWidth: 460, lineHeight: 1.55}}>
              {LEVEL_COPY[level].description}
            </p>
          </div>
          <div
            style={{
              border: '1px solid rgba(var(--rgb-line),0.14)',
              borderRadius: 8,
              padding: '11.2px 14px',
              background: 'rgba(var(--rgb-bg),0.55)',
              backdropFilter: 'blur(8px)',
              minWidth: 190,
            }}>
            <div style={{fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-neutral-500)'}}>
              Definido por
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 12.5, color: 'var(--color-neutral-100)', marginTop: 5.6, fontWeight: 600}}>
              <i className="ph-fill ph-sparkle" aria-hidden="true" style={{fontSize: 13, color: 'var(--color-accent-200)'}} />
              {sourceLabel({isLoading, hasProfile: Boolean(profile), isOverride, signalCount})}
            </div>
            {/* O InvestorProfileService recalcula o nível uma vez por dia. */}
            <div style={{fontSize: 10.5, color: 'var(--color-neutral-500)', marginTop: 5.6, lineHeight: 1.45}}>
              Revisado diariamente. Você pode fixar um nível a qualquer momento.
            </div>
          </div>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 11.2, marginTop: 22.4, flexWrap: 'wrap'}}>
          <div
            role="group"
            aria-label="Nível de detalhe"
            style={{display: 'flex', padding: 2.8, gap: 2.8, border: '1px solid rgba(var(--rgb-line),0.16)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.62)'}}>
            {ADAPTIVE_LEVELS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={option === level}
                onClick={() => setLevel(option)}
                style={segmentStyle(option === level)}>
                {LEVEL_COPY[option].label}
              </button>
            ))}
          </div>
          <label style={{display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 12, color: 'var(--color-neutral-300)', cursor: profile ? 'pointer' : 'not-allowed'}}>
            <input
              type="checkbox"
              checked={!isOverride}
              disabled={!profile}
              onChange={(event) =>
                // Desmarcar fixa o nível atual; marcar devolve a escolha à IA.
                event.target.checked ? clearOverride() : setLevel(level)
              }
              style={{width: 15, height: 15, accentColor: 'var(--ac)'}}
            />
            Deixar a IA ajustar automaticamente
          </label>
        </div>
      </div>
    </section>
  );
}
