import type React from 'react';
import {SectionHeader} from '@/components/shared';
import {Slider} from '@/components/ui/slider';
import type {FutureSimulatorHorizon} from '@/services/ai';
import {formatCurrency} from '@/utils/formatters';
import type {useFutureSimulator} from '@/hooks/useFutureSimulator';
import {ACCENT_BUTTON_CLASS, CARD_STYLE, segStyle} from './insights.styles';

const HORIZON_OPTIONS: {value: FutureSimulatorHorizon; label: string}[] = [
  {value: '6m', label: '6 meses'},
  {value: '1y', label: '1 ano'},
  {value: '5y', label: '5 anos'},
  {value: '10y', label: '10 anos'},
];

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--color-neutral-600)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

type SimulatorModel = ReturnType<typeof useFutureSimulator>;

export function FutureSimulatorCard({simulator}: {simulator: SimulatorModel}) {
  const {result} = simulator;

  return (
    <section style={CARD_STYLE}>
      <SectionHeader
        title="Simulador de futuro"
        subtitle="O que acontece se você investir regularmente"
      />
      <div
        style={{
          padding: 16.8,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16.8,
        }}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8.4}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
              <span style={LABEL_STYLE}>Aporte mensal</span>
              <span style={{fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--color-neutral-100)'}}>
                {formatCurrency(simulator.monthlyContribution)}
              </span>
            </div>
            <Slider
              value={[simulator.monthlyContribution]}
              onValueChange={(value) => simulator.setMonthlyContribution(value[0])}
              max={10000}
              step={100}
              className="py-2"
            />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8.4}}>
            <span style={LABEL_STYLE}>Horizonte</span>
            <div style={{display: 'flex', gap: 5.6, flexWrap: 'wrap'}}>
              {HORIZON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={simulator.horizon === option.value}
                  onClick={() => simulator.setHorizon(option.value)}
                  style={segStyle(simulator.horizon === option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={simulator.simulate}
            disabled={simulator.isLoading}
            className={ACCENT_BUTTON_CLASS}
            style={{
              height: 32,
              borderRadius: 8,
              border: '1px solid var(--color-accent-700)',
              color: 'var(--color-accent-200)',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}>
            {simulator.isLoading ? 'Calculando…' : 'Calcular Projeção IA'}
          </button>
        </div>

        <div
          style={{
            border: '1px solid var(--hair-soft)',
            borderRadius: 8,
            background: 'rgba(var(--rgb-line),0.03)',
            padding: 16.8,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 11.2,
            minHeight: 160,
          }}>
          {result ? (
            <>
              <div>
                <div style={LABEL_STYLE}>Patrimônio esperado</div>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: '-0.015em',
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: 4,
                  }}>
                  {formatCurrency(result.simulation.scenarios.base.projectedValue)}
                </div>
                <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2, fontVariantNumeric: 'tabular-nums'}}>
                  {formatCurrency(result.simulation.scenarios.base.range.lower)}
                  {' – '}
                  {formatCurrency(result.simulation.scenarios.base.range.upper)}
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 11.2,
                  paddingTop: 11.2,
                  borderTop: '1px solid var(--hair-soft)',
                }}>
                <ScenarioValue label="Pessimista" value={result.simulation.scenarios.pessimistic.projectedValue} color="var(--neg)" />
                <ScenarioValue label="Otimista" value={result.simulation.scenarios.optimistic.projectedValue} color="var(--pos)" />
              </div>
              {result.cdiComparison !== null && (
                <div style={{paddingTop: 11.2, borderTop: '1px solid var(--hair-soft)'}}>
                  <ScenarioValue
                    label={`CDI acumulado (últimos ${result.simulation.months} meses)`}
                    value={result.cdiComparison}
                    color="var(--color-neutral-100)"
                  />
                  <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 4, lineHeight: 1.5}}>
                    Estimativa simplificada: aplica o CDI já realizado nos últimos {result.simulation.months} meses
                    sobre o valor atual da carteira, sem simular os aportes mensais dentro do CDI.
                  </div>
                </div>
              )}
              {result.simulation.limitations.length > 0 && (
                <div style={{fontSize: 11, color: 'var(--color-neutral-600)'}}>
                  Projeção com dados parciais da carteira.
                </div>
              )}
            </>
          ) : (
            <div style={{fontSize: 12, color: 'var(--color-neutral-500)', textAlign: 'center', lineHeight: 1.5}}>
              Ajuste os aportes e simule o poder dos juros compostos.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ScenarioValue({label, value, color}: {label: string; value: number; color: string}) {
  return (
    <div>
      <div style={LABEL_STYLE}>{label}</div>
      <div style={{fontSize: 13, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', marginTop: 2}}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}
