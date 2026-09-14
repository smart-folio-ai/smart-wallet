import {useReducer, useState} from 'react';
import useAppToast from '@/hooks/use-app-toast';
import {
  policyErrorMessage,
  useInvestmentPolicy,
  useInvestmentPolicyVersions,
  useSaveInvestmentPolicy,
} from '@/hooks/useInvestmentPolicy';
import type {InvestmentBenchmark, InvestmentPolicy} from '@/server/api/api';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {
  CARD_STYLE,
  INPUT_STYLE,
  OUTLINE_BUTTON_CLASS,
  OUTLINE_BUTTON_STYLE,
  PRIMARY_BUTTON_CLASS,
  PRIMARY_BUTTON_STYLE,
  SettingsCardHeader,
} from './settings-ui';

type PercentField = Exclude<keyof InvestmentPolicy, 'benchmark'>;

const PERCENT_FIELDS: {field: PercentField; label: string; hint: string}[] = [
  {field: 'maxAssetWeightPct', label: 'Limite por ativo', hint: 'gera alerta de concentração'},
  {field: 'maxSectorWeightPct', label: 'Limite por setor', hint: 'soma dos ativos do mesmo setor'},
  {field: 'fixedIncomeTargetPct', label: 'Alvo em renda fixa', hint: 'tolerância de ±3 p.p.'},
  {field: 'brStocksTargetPct', label: 'Alvo em ações BR', hint: 'tolerância de ±3 p.p.'},
  {field: 'maxCryptoPct', label: 'Exposição máx. em cripto', hint: 'soma de todas as criptomoedas'},
];

export const BENCHMARK_LABELS: Record<InvestmentBenchmark, string> = {
  IBOV_CDI: 'IBOV + CDI',
  IBOV: 'IBOV',
  CDI: 'CDI',
  IFIX: 'IFIX',
  SMLL: 'SMLL',
  IVVB11: 'IVVB11 (S&P 500)',
};

type FormState = Record<PercentField, string> & {benchmark: InvestmentBenchmark};

type FormAction =
  | {type: 'percent'; field: PercentField; value: string}
  | {type: 'benchmark'; value: InvestmentBenchmark}
  | {type: 'load'; policy: InvestmentPolicy};

const formatPercent = (value: number) => `${String(value).replace('.', ',')}%`;

function toForm(policy: InvestmentPolicy): FormState {
  return {
    maxAssetWeightPct: formatPercent(policy.maxAssetWeightPct),
    maxSectorWeightPct: formatPercent(policy.maxSectorWeightPct),
    fixedIncomeTargetPct: formatPercent(policy.fixedIncomeTargetPct),
    brStocksTargetPct: formatPercent(policy.brStocksTargetPct),
    maxCryptoPct: formatPercent(policy.maxCryptoPct),
    benchmark: policy.benchmark,
  };
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'percent':
      return {...state, [action.field]: action.value};
    case 'benchmark':
      return {...state, benchmark: action.value};
    case 'load':
      return toForm(action.policy);
  }
}

/** Aceita "8", "8%" e "8,5 %"; `null` quando não é um percentual de 0 a 100. */
export function parsePercent(raw: string): number | null {
  const normalized = raw.replace('%', '').trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  return value <= 100 ? value : null;
}

function PolicyHistoryDialog({
  open,
  onOpenChange,
  onRestore,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (policy: InvestmentPolicy) => void;
}) {
  const {data: versions = [], isLoading, isError} = useInvestmentPolicyVersions(open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de versões</DialogTitle>
          <DialogDescription>
            As últimas versões salvas da sua política. Restaurar preenche o formulário; nada muda até você salvar.
          </DialogDescription>
        </DialogHeader>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8.4, maxHeight: 360, overflowY: 'auto'}}>
          {isLoading ? <div style={{fontSize: 12, color: 'var(--color-neutral-500)'}}>Carregando…</div> : null}
          {isError ? <div style={{fontSize: 12, color: 'var(--neg)'}}>Não foi possível carregar o histórico.</div> : null}
          {!isLoading && !isError && versions.length === 0 ? (
            <div style={{fontSize: 12, color: 'var(--color-neutral-500)'}}>Nenhuma versão anterior ainda.</div>
          ) : null}
          {versions.map((version) => (
            <div
              key={version.savedAt}
              data-testid="policy-version"
              style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 11.2px', border: '1px solid var(--hair)', borderRadius: 8}}>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize: 12.5, fontWeight: 600}}>
                  {new Date(version.savedAt).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})}
                </div>
                <div style={{fontSize: 10.5, color: 'var(--color-neutral-500)', marginTop: 2}}>
                  ativo {formatPercent(version.policy.maxAssetWeightPct)} · setor {formatPercent(version.policy.maxSectorWeightPct)} · RF{' '}
                  {formatPercent(version.policy.fixedIncomeTargetPct)} · ações BR {formatPercent(version.policy.brStocksTargetPct)} · cripto{' '}
                  {formatPercent(version.policy.maxCryptoPct)} · {BENCHMARK_LABELS[version.policy.benchmark]}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRestore(version.policy)}
                className={OUTLINE_BUTTON_CLASS}
                style={{...OUTLINE_BUTTON_STYLE, height: 30}}>
                Restaurar
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PolicyForm({initial}: {initial: InvestmentPolicy}) {
  const toast = useAppToast();
  const [form, dispatch] = useReducer(formReducer, initial, toForm);
  const [historyOpen, setHistoryOpen] = useState(false);
  const save = useSaveInvestmentPolicy();

  const handleSave = () => {
    const values = {} as Record<PercentField, number>;
    for (const {field, label} of PERCENT_FIELDS) {
      const parsed = parsePercent(form[field]);
      if (parsed === null) {
        toast.error('Valor inválido', `${label}: use um percentual de 0% a 100%.`);
        return;
      }
      values[field] = parsed;
    }
    save.mutate(
      {...values, benchmark: form.benchmark},
      {
        onSuccess: () =>
          toast.success('Política atualizada', 'Novos limites valem a partir da próxima leitura do copiloto.'),
        onError: (error) =>
          toast.error('Não foi possível salvar a política', policyErrorMessage(error) ?? 'Tente novamente em instantes.'),
      },
    );
  };

  return (
    <>
      <div style={{padding: 16.8, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14}}>
        {PERCENT_FIELDS.map(({field, label, hint}) => (
          <label key={field} style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
            <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>{label}</span>
            <input
              type="text"
              inputMode="decimal"
              aria-label={label}
              value={form[field]}
              onChange={(event) => dispatch({type: 'percent', field, value: event.target.value})}
              style={INPUT_STYLE}
            />
            <span style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>{hint}</span>
          </label>
        ))}
        <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
          <span style={{fontSize: 11.5, color: 'var(--color-neutral-400)'}}>Benchmark de comparação</span>
          <select
            aria-label="Benchmark de comparação"
            value={form.benchmark}
            onChange={(event) => dispatch({type: 'benchmark', value: event.target.value as InvestmentBenchmark})}
            style={INPUT_STYLE}>
            {Object.entries(BENCHMARK_LABELS).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
          <span style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>usado no alpha e tracking error</span>
        </label>
      </div>
      <div style={{display: 'flex', gap: 8.4, padding: '0 16.8px 16.8px'}}>
        <button type="button" onClick={handleSave} disabled={save.isPending} className={PRIMARY_BUTTON_CLASS} style={PRIMARY_BUTTON_STYLE}>
          {save.isPending ? 'Salvando…' : 'Salvar política'}
        </button>
        <button type="button" onClick={() => setHistoryOpen(true)} className={OUTLINE_BUTTON_CLASS} style={OUTLINE_BUTTON_STYLE}>
          Ver histórico de versões
        </button>
      </div>
      <PolicyHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onRestore={(policy) => {
          dispatch({type: 'load', policy});
          setHistoryOpen(false);
        }}
      />
    </>
  );
}

export function InvestmentPolicyCard() {
  const {data, isLoading, isError, refetch} = useInvestmentPolicy();

  return (
    <section style={CARD_STYLE}>
      <SettingsCardHeader title="Política de investimento" subtitle="Os limites que geram os alertas do copiloto" />
      {data ? (
        // A chave remonta o formulário quando o server devolve uma versão nova.
        <PolicyForm key={data.savedAt ?? 'default'} initial={data.policy} />
      ) : (
        <div style={{padding: 16.8, fontSize: 12, color: 'var(--color-neutral-500)'}}>
          {isLoading ? (
            'Carregando política…'
          ) : isError ? (
            <button type="button" onClick={() => refetch()} className={OUTLINE_BUTTON_CLASS} style={OUTLINE_BUTTON_STYLE}>
              Não foi possível carregar · tentar de novo
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
