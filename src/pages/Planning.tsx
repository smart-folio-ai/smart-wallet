import {useReducer, useState, type CSSProperties} from 'react';
import useAppToast from '@/hooks/use-app-toast';
import {apiMessage, useFinancialPlan, useUpdatePlanSettings} from '@/hooks/useFinancialPlan';
import {usePortfolioComposition} from '@/hooks/usePortfolioComposition';
import type {FinancialGoal, FinancialPlan} from '@/server/api/api';
import {formatCurrency, formatCurrencyCompactPtBr} from '@/utils/formatters';
import {GoalDialog, parseMoney} from '@/components/planning/GoalDialog';
import {ProjectionChart} from '@/components/planning/ProjectionChart';
import {
  SAFE_WITHDRAWAL_RATE,
  addMonthsLabel,
  buildScenarios,
  formatDuration,
  monthsToTarget,
} from '@/services/planning/projection';

const cardStyle: CSSProperties = {border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'};
const headStyle: CSSProperties = {padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)'};
const titleStyle: CSSProperties = {fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0};
const subStyle: CSSProperties = {fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2};

const pctLabel = (value: number) => `${value.toFixed(1).replace('.', ',')}%`;

const GOAL_STYLE = {
  independence: {kicker: 'Meta principal', icon: 'ph-fill ph-target', grad: 'linear-gradient(90deg, var(--ac), var(--cy))'},
  emergency: {kicker: 'Curto prazo', icon: 'ph-fill ph-shield-check', grad: 'linear-gradient(90deg, var(--pos), var(--cy))'},
  custom: {kicker: 'Objetivo dedicado', icon: 'ph-fill ph-house', grad: 'linear-gradient(90deg, var(--warn), var(--neg))'},
} as const;

interface GoalProgress {
  current: number;
  pct: number;
  eta: string;
  note: string;
}

function goalProgress(goal: FinancialGoal, plan: FinancialPlan, portfolioValue: number, monthlyIncome: number): GoalProgress {
  const independence = goal.kind === 'independence';
  const current = independence ? portfolioValue : goal.currentAmount;
  const monthly = independence ? plan.monthlyContribution : goal.monthlyContribution;
  // Reserva fica em liquidez diária: não conta com ganho real.
  const rate = goal.kind === 'emergency' ? 0 : plan.expectedRealReturnPct;
  const pct = Math.min((current / goal.targetAmount) * 100, 100);
  const months = monthsToTarget(current, monthly, rate, goal.targetAmount);

  const eta =
    pct >= 100
      ? 'concluída'
      : months === null
        ? 'sem aporte para concluir'
        : `projeção: ${addMonthsLabel(months, new Date(), !independence)}`;

  const remaining = Math.max(goal.targetAmount - current, 0);
  const note = independence
    ? `Seus proventos rendem ${formatCurrency(monthlyIncome)}/mês hoje. Com a meta, a retirada de 4% ao ano paga ${formatCurrency((goal.targetAmount * SAFE_WITHDRAWAL_RATE) / 12)}/mês.`
    : remaining > 0
      ? `Faltam ${formatCurrency(remaining)} para fechar a meta.${monthly ? ` Aporte dedicado de ${formatCurrency(monthly)}/mês.` : ''}`
      : 'Meta concluída. Mantenha o valor guardado.';

  return {current, pct, eta, note};
}

function GoalCard({goal, progress, onEdit}: {goal: FinancialGoal; progress: GoalProgress; onEdit: () => void}) {
  const featured = goal.kind === 'independence';
  const style = GOAL_STYLE[goal.kind];
  return (
    <section
      data-testid="planning-goal"
      style={{
        borderRadius: 8,
        padding: 16.8,
        ...(featured
          ? {border: '1px solid rgba(152,160,171,0.34)', background: 'linear-gradient(130deg, rgba(123,130,144,0.30) 0%, rgba(76,201,240,0.10) 55%, rgba(var(--rgb-surf-2),0.9) 100%), var(--surf-2)'}
          : cardStyle),
      }}>
      <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11.2}}>
        <div>
          <div style={{fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-500)'}}>{style.kicker}</div>
          <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, margin: '5.6px 0 0', letterSpacing: '-0.015em'}}>{goal.title}</h2>
        </div>
        <button type="button" onClick={onEdit} aria-label={`Editar ${goal.title}`} style={{border: 'none', background: 'transparent', padding: 0, cursor: 'pointer'}}>
          <i className={style.icon} style={{fontSize: 20, color: featured ? 'var(--color-accent-200)' : 'var(--color-neutral-500)'}} aria-hidden />
        </button>
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 8.4, marginTop: 16.8}}>
        <span style={{fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums'}}>{formatCurrencyCompactPtBr(progress.current)}</span>
        <span style={{fontSize: 12, color: 'var(--color-neutral-500)'}}>de {formatCurrencyCompactPtBr(goal.targetAmount)}</span>
      </div>
      <div style={{height: 10, borderRadius: 2, background: 'rgba(var(--rgb-line),0.08)', marginTop: 11.2, overflow: 'hidden'}}>
        <div style={{height: '100%', width: `${progress.pct}%`, borderRadius: 2, background: style.grad}} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', gap: 8.4, marginTop: 8.4, fontSize: 11.5}}>
        <span style={{fontWeight: 600, color: progress.pct > 90 ? 'var(--pos)' : 'var(--color-accent-200)'}}>{pctLabel(progress.pct)} concluído</span>
        <span style={{color: 'var(--color-neutral-500)', fontVariantNumeric: 'tabular-nums'}}>{progress.eta}</span>
      </div>
      <div style={{fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 11.2, paddingTop: 11.2, borderTop: '1px solid var(--hair-soft)', lineHeight: 1.5}}>{progress.note}</div>
    </section>
  );
}

interface SimForm {
  contribution: string;
  returnPct: string;
  horizon: string;
}

const simReducer = (state: SimForm, patch: Partial<SimForm>): SimForm => ({...state, ...patch});

function parsePct(raw: string): number | null {
  const value = Number(raw.replace('%', '').replace(',', '.').trim());
  return raw.trim() !== '' && Number.isFinite(value) ? value : null;
}

function Simulator({plan, portfolioValue, independence}: {plan: FinancialPlan; portfolioValue: number; independence?: FinancialGoal}) {
  const toast = useAppToast();
  const apply = useUpdatePlanSettings();
  const [form, update] = useReducer(simReducer, {
    contribution: String(plan.monthlyContribution),
    returnPct: String(plan.expectedRealReturnPct).replace('.', ','),
    horizon: String(plan.horizonYears),
  });

  const contribution = parseMoney(form.contribution);
  const returnPct = parsePct(form.returnPct);
  const horizon = Number(form.horizon.replace(/\D/g, ''));
  const valid = contribution !== null && returnPct !== null && returnPct >= -20 && returnPct <= 30 && horizon >= 1 && horizon <= 50;

  let result = 'Preencha aporte, retorno (-20% a 30%) e horizonte (1 a 50 anos).';
  if (valid) {
    const simulatedFinal = buildScenarios(portfolioValue, contribution, returnPct, horizon).expected[horizon];
    if (independence) {
      const planMonths = monthsToTarget(portfolioValue, plan.monthlyContribution, plan.expectedRealReturnPct, independence.targetAmount);
      const simMonths = monthsToTarget(portfolioValue, contribution, returnPct, independence.targetAmount);
      if (simMonths === null) result = `Com ${formatCurrency(contribution)} por mês, a meta de independência não é atingida em 100 anos.`;
      else if (planMonths === null || simMonths < planMonths)
        result = `Com ${formatCurrency(contribution)} por mês, você chega na meta ${planMonths === null ? `em ${formatDuration(simMonths)}` : `${formatDuration(planMonths - simMonths)} mais cedo`}.`;
      else if (simMonths > planMonths) result = `Com ${formatCurrency(contribution)} por mês, a meta atrasa ${formatDuration(simMonths - planMonths)}.`;
      else result = `Mesmo prazo do plano atual: meta em ${formatDuration(simMonths)}.`;
    } else {
      result = `Com ${formatCurrency(contribution)} por mês, o patrimônio chega a ${formatCurrencyCompactPtBr(simulatedFinal)} em ${horizon} anos, em reais de hoje.`;
    }
  }

  const fields: {key: keyof SimForm; label: string; inputMode: 'decimal' | 'numeric'}[] = [
    {key: 'contribution', label: 'Aporte mensal', inputMode: 'decimal'},
    {key: 'returnPct', label: 'Retorno real esperado (a.a.)', inputMode: 'decimal'},
    {key: 'horizon', label: 'Horizonte (anos)', inputMode: 'numeric'},
  ];

  return (
    <section style={cardStyle}>
      <div style={headStyle}>
        <h2 style={titleStyle}>Simulador de aporte</h2>
        <div style={subStyle}>Ajuste e veja o efeito na projeção</div>
      </div>
      <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 14}}>
        {fields.map((field) => (
          <label key={field.key} style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>{field.label}</span>
            <input
              aria-label={field.label}
              inputMode={field.inputMode}
              value={form[field.key]}
              onChange={(e) => update({[field.key]: e.target.value})}
              style={{height: 36, padding: '0 11.2px', border: '1px solid var(--hair)', borderRadius: 8, background: 'rgba(var(--rgb-bg),0.6)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: 13, fontVariantNumeric: 'tabular-nums'}}
            />
          </label>
        ))}
        <div style={{borderRadius: 8, padding: 14, background: 'linear-gradient(120deg, rgba(47,214,163,0.16), rgba(76,201,240,0.10))', border: '1px solid rgba(47,214,163,0.28)'}}>
          <div style={{fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pos)'}}>Resultado da simulação</div>
          <div data-testid="sim-result" style={{fontSize: 13, color: 'var(--color-neutral-200)', marginTop: 8.4, lineHeight: 1.55}}>{result}</div>
        </div>
        <button
          type="button"
          disabled={!valid || apply.isPending}
          onClick={() =>
            valid &&
            apply.mutate(
              {monthlyContribution: contribution, expectedRealReturnPct: returnPct, horizonYears: horizon},
              {
                onSuccess: () => toast.success('Plano atualizado', `Aporte de ${formatCurrency(contribution)}/mês aplicado à projeção.`),
                onError: (error) => toast.error('Não foi possível atualizar o plano', apiMessage(error) ?? 'Tente novamente em instantes.'),
              },
            )
          }
          className="hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-60"
          style={{height: 36, borderRadius: 8, border: 'none', background: 'var(--grad-aurora)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'}}>
          {apply.isPending ? 'Aplicando…' : 'Aplicar ao plano'}
        </button>
      </div>
    </section>
  );
}

/** Planejamento — bloco `isPlanning` de design_handoff_trackerr/Trackerr App.dc.html. */
export default function Planning() {
  const planQuery = useFinancialPlan();
  const composition = usePortfolioComposition();
  const [dialog, setDialog] = useState<{open: boolean; goal?: FinancialGoal}>({open: false});

  const plan = planQuery.data;
  const portfolioValue = composition.data?.rebalancing.totalValue ?? 0;
  const monthlyIncome = (composition.data?.yield.estimatedAnnualIncome ?? 0) / 12;

  if (planQuery.isLoading) return <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)'}}>Carregando plano…</div>;
  if (planQuery.isError || !plan) {
    return (
      <div role="alert" style={{fontSize: 12.5, color: 'var(--neg)'}}>
        Não foi possível carregar o plano.{' '}
        <button type="button" onClick={() => planQuery.refetch()} style={{border: 'none', background: 'transparent', color: 'var(--color-accent-200)', cursor: 'pointer', font: 'inherit'}}>
          Tentar de novo
        </button>
      </div>
    );
  }

  const independence = plan.goals.find((goal) => goal.kind === 'independence');
  const horizon = plan.horizonYears;
  const scenarios = buildScenarios(portfolioValue, plan.monthlyContribution, plan.expectedRealReturnPct, horizon);
  const finalYear = new Date().getFullYear() + horizon;
  const expectedFinal = scenarios.expected[horizon];
  const goalMonths = independence ? monthsToTarget(portfolioValue, plan.monthlyContribution, plan.expectedRealReturnPct, independence.targetAmount) : null;
  const labelStep = Math.max(1, Math.round(horizon / 4));
  const labels = Array.from({length: Math.floor(horizon / labelStep) + 1}, (_, i) => String(new Date().getFullYear() + i * labelStep));

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <div className="grid grid-cols-1 gap-[16.8px] md:grid-cols-2 xl:grid-cols-3">
        {plan.goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} progress={goalProgress(goal, plan, portfolioValue, monthlyIncome)} onEdit={() => setDialog({open: true, goal})} />
        ))}
        {plan.goals.length < 6 && (
          <button
            type="button"
            onClick={() => setDialog({open: true})}
            className="hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)]"
            style={{minHeight: 180, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: 'var(--hair)', background: 'transparent', color: 'var(--color-neutral-400)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8.4, fontFamily: 'var(--font-body)', fontSize: 12.5}}>
            <i className="ph ph-plus-circle" style={{fontSize: 22}} aria-hidden />
            {plan.goals.length ? 'Nova meta' : 'Crie sua primeira meta: independência financeira, reserva ou um objetivo'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-[16.8px] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section style={cardStyle}>
          <div style={{...headStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 11.2, flexWrap: 'wrap'}}>
            <div>
              <h2 style={titleStyle}>Projeção de patrimônio · {horizon} anos</h2>
              <div style={subStyle}>
                Cenários conservador, esperado e otimista com aporte de {formatCurrency(plan.monthlyContribution)}/mês · valores em reais de hoje
              </div>
            </div>
            <div style={{display: 'flex', gap: 14}}>
              {[
                {label: 'Otimista', dot: {width: 14, height: 0, borderTop: '2px dashed var(--pos)'}},
                {label: 'Esperado', dot: {width: 14, height: 3, borderRadius: 2, background: 'var(--ac-soft)'}},
                {label: 'Conservador', dot: {width: 14, height: 3, borderRadius: 2, background: 'var(--cy)'}},
              ].map((item) => (
                <div key={item.label} style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 11, color: 'var(--color-neutral-400)'}}>
                  <span style={item.dot} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{padding: 16.8}}>
            <ProjectionChart
              series={[
                {values: scenarios.optimistic, color: 'var(--pos)', width: 2, dash: true},
                {values: scenarios.conservative, color: 'var(--cy)', width: 2.25},
                {values: scenarios.expected, color: 'var(--ac-soft)', width: 3.25},
              ]}
              labels={labels}
              labelStep={labelStep}
            />
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, borderTop: '1px solid var(--hair-soft)', background: 'var(--hair-soft)'}}>
            {[
              {label: `Patrimônio em ${finalYear}`, value: formatCurrencyCompactPtBr(expectedFinal), color: 'var(--color-neutral-100)'},
              {label: 'Renda passiva mensal', value: formatCurrencyCompactPtBr((expectedFinal * SAFE_WITHDRAWAL_RATE) / 12), color: 'var(--pos)'},
              {label: 'Meta atingida em', value: goalMonths === null ? '—' : addMonthsLabel(goalMonths), color: 'var(--color-accent-200)'},
            ].map((stat) => (
              <div key={stat.label} style={{padding: '11.2px 16.8px', background: 'var(--surf-3)'}}>
                <div style={{fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-neutral-600)'}}>{stat.label}</div>
                <div style={{fontSize: 15, fontWeight: 600, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: stat.color}}>{stat.value}</div>
              </div>
            ))}
          </div>
        </section>

        <Simulator key={`${plan.monthlyContribution}-${plan.expectedRealReturnPct}-${plan.horizonYears}`} plan={plan} portfolioValue={portfolioValue} independence={independence} />
      </div>

      {dialog.open && (
        <GoalDialog
          key={dialog.goal?.id ?? 'new'}
          open
          onOpenChange={(open) => !open && setDialog({open: false})}
          goal={dialog.goal}
          hasIndependence={Boolean(independence)}
        />
      )}
    </div>
  );
}
