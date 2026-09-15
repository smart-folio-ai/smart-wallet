import {useReducer, type CSSProperties} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import useAppToast from '@/hooks/use-app-toast';
import {apiMessage, useRemoveGoal, useSaveGoal} from '@/hooks/useFinancialPlan';
import type {FinancialGoal, GoalKind} from '@/server/api/api';

export const GOAL_KIND_LABELS: Record<GoalKind, string> = {
  independence: 'Independência financeira',
  emergency: 'Reserva de emergência',
  custom: 'Objetivo dedicado',
};

const fieldStyle: CSSProperties = {
  height: 36,
  padding: '0 11.2px',
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'rgba(var(--rgb-bg),0.6)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  width: '100%',
};

interface Form {
  title: string;
  kind: GoalKind;
  targetAmount: string;
  currentAmount: string;
  monthlyContribution: string;
}

const toForm = (goal?: FinancialGoal): Form => ({
  title: goal?.title ?? '',
  kind: goal?.kind ?? 'custom',
  targetAmount: goal ? String(goal.targetAmount) : '',
  currentAmount: goal ? String(goal.currentAmount) : '',
  monthlyContribution: goal ? String(goal.monthlyContribution) : '',
});

const reducer = (state: Form, patch: Partial<Form>): Form => ({...state, ...patch});

/** Aceita "420.000", "420000" e "1.234,56". */
export function parseMoney(raw: string): number | null {
  const normalized = raw.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  if (normalized === '') return 0;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function GoalDialog({open, onOpenChange, goal, hasIndependence}: {open: boolean; onOpenChange: (open: boolean) => void; goal?: FinancialGoal; hasIndependence: boolean}) {
  const toast = useAppToast();
  const [form, update] = useReducer(reducer, goal, toForm);
  const save = useSaveGoal();
  const remove = useRemoveGoal();
  const isIndependence = form.kind === 'independence';

  const submit = () => {
    const target = parseMoney(form.targetAmount);
    const current = parseMoney(form.currentAmount);
    const monthly = parseMoney(form.monthlyContribution);
    if (!form.title.trim()) return toast.error('Dê um nome à meta', 'Ex.: Entrada do imóvel.');
    if (!target) return toast.error('Valor da meta inválido', 'Informe quanto você quer juntar.');
    if (current === null || monthly === null) return toast.error('Valor inválido', 'Use apenas números.');
    save.mutate(
      {id: goal?.id, goal: {title: form.title.trim(), kind: form.kind, targetAmount: target, currentAmount: isIndependence ? 0 : current, monthlyContribution: isIndependence ? 0 : monthly}},
      {
        onSuccess: () => {
          toast.success(goal ? 'Meta atualizada' : 'Meta criada', form.title.trim());
          onOpenChange(false);
        },
        onError: (error) => toast.error('Não foi possível salvar a meta', apiMessage(error) ?? 'Tente novamente em instantes.'),
      },
    );
  };

  const label = (text: string) => <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>{text}</span>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? 'Editar meta' : 'Nova meta'}</DialogTitle>
          <DialogDescription>
            {isIndependence ? 'O progresso acompanha o patrimônio da sua carteira e o aporte do plano.' : 'Informe quanto já guardou e quanto aporta por mês para esta meta.'}
          </DialogDescription>
        </DialogHeader>
        <div style={{display: 'flex', flexDirection: 'column', gap: 11.2}}>
          <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            {label('Nome')}
            <input aria-label="Nome" value={form.title} maxLength={60} onChange={(e) => update({title: e.target.value})} style={fieldStyle} />
          </label>
          <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            {label('Tipo')}
            <select aria-label="Tipo" value={form.kind} onChange={(e) => update({kind: e.target.value as GoalKind})} style={fieldStyle}>
              {(Object.keys(GOAL_KIND_LABELS) as GoalKind[])
                .filter((kind) => kind !== 'independence' || !hasIndependence || goal?.kind === 'independence')
                .map((kind) => (
                  <option key={kind} value={kind}>
                    {GOAL_KIND_LABELS[kind]}
                  </option>
                ))}
            </select>
          </label>
          <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            {label('Valor da meta (R$)')}
            <input aria-label="Valor da meta" inputMode="decimal" value={form.targetAmount} onChange={(e) => update({targetAmount: e.target.value})} style={fieldStyle} />
          </label>
          {!isIndependence && (
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11.2}}>
              <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
                {label('Já guardado (R$)')}
                <input aria-label="Já guardado" inputMode="decimal" value={form.currentAmount} onChange={(e) => update({currentAmount: e.target.value})} style={fieldStyle} />
              </label>
              <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
                {label('Aporte mensal (R$)')}
                <input aria-label="Aporte mensal da meta" inputMode="decimal" value={form.monthlyContribution} onChange={(e) => update({monthlyContribution: e.target.value})} style={fieldStyle} />
              </label>
            </div>
          )}
          <div style={{display: 'flex', gap: 8.4, marginTop: 5.6}}>
            {goal && (
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(goal.id, {
                    onSuccess: () => {
                      toast.success('Meta apagada', goal.title);
                      onOpenChange(false);
                    },
                    onError: () => toast.error('Não foi possível apagar', 'Tente novamente em instantes.'),
                  })
                }
                style={{height: 36, padding: '0 14px', borderRadius: 8, border: '1px solid rgba(242,80,107,0.40)', background: 'transparent', color: 'var(--neg)', fontSize: 12.5, cursor: 'pointer'}}>
                Apagar
              </button>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={save.isPending}
              className="hover:brightness-[1.08] disabled:opacity-60"
              style={{flex: 1, height: 36, borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'}}>
              {save.isPending ? 'Salvando…' : 'Salvar meta'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
