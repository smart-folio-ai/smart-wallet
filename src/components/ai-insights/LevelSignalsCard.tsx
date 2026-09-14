import {SectionHeader} from '@/components/shared';
import type {AdaptiveLevel} from '@/contexts/AdaptiveLevelContext';
import type {InvestorProfileResponse} from '@/services/ai/investorProfile';
import {CARD_STYLE, GHOST_BUTTON_CLASS} from './insights.styles';
import type {SignalRow} from './level-signals';

const LEVEL_LABEL: Record<AdaptiveLevel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

interface LevelSignalsCardProps {
  level: AdaptiveLevel;
  profile: InvestorProfileResponse | null;
  rows: SignalRow[];
  onToggleManualControl: () => void;
}

export function LevelSignalsCard({
  level,
  profile,
  rows,
  onToggleManualControl,
}: LevelSignalsCardProps) {
  const isManual = profile?.source === 'user_override';
  const signalsCount = profile ? Object.keys(profile.signals ?? {}).length : 0;
  const subtitle = profile
    ? `${isManual ? 'Manual' : 'Sugerido'}: ${LEVEL_LABEL[level]} · ${signalsCount} sinais de uso`
    : 'Perfil ainda não calculado';

  return (
    <section style={CARD_STYLE}>
      <SectionHeader title="Como a IA definiu seu nível" subtitle={subtitle} />
      <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 11.2}}>
        {rows.map((row) => (
          <div key={row.label} style={{display: 'flex', alignItems: 'center', gap: 11.2}}>
            <span style={{flex: 1, fontSize: 12, color: 'var(--color-neutral-300)'}}>{row.label}</span>
            <div
              style={{
                width: 84,
                height: 6,
                borderRadius: 2,
                background: 'rgba(var(--rgb-line),0.06)',
                overflow: 'hidden',
              }}>
              <div
                data-testid="signal-bar"
                style={{
                  height: '100%',
                  width: `${Math.min(Math.max(row.ratio ?? 0, 0), 1) * 100}%`,
                  background: 'var(--color-accent-400)',
                }}
              />
            </div>
            <span
              style={{
                width: 34,
                textAlign: 'right',
                fontSize: 11,
                color: 'var(--color-neutral-500)',
                fontVariantNumeric: 'tabular-nums',
              }}>
              {row.value}
            </span>
          </div>
        ))}
        <button
          type="button"
          onClick={onToggleManualControl}
          disabled={!profile}
          className={GHOST_BUTTON_CLASS}
          style={{
            marginTop: 5.6,
            height: 32,
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: 'solid',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            cursor: 'pointer',
          }}>
          {isManual ? 'Devolver controle à IA' : 'Assumir controle manual'}
        </button>
      </div>
    </section>
  );
}
