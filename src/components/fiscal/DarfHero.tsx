import {useState, type ReactNode} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import useAppToast from '@/hooks/use-app-toast';
import {formatCurrency} from '@/utils/formatters';
import {
  DARF_MINIMUM,
  buildCalcRows,
  darfCode,
  darfDueDate,
  monthName,
  type CalcTone,
  type FiscalMonth,
} from '@/services/fiscal/fiscal-summary';

const SICALC_URL = 'https://sicalc.receita.economia.gov.br/sicalc/principal';

const toneColor: Record<CalcTone, string> = {
  neutral: 'var(--color-neutral-200)',
  positive: 'var(--pos)',
  negative: 'var(--neg)',
  total: 'var(--warn)',
};

const formatDay = (date: Date) => date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});

const outlineButtonClass =
  'text-[color:var(--color-neutral-200)] hover:border-[color:var(--color-accent-400)] hover:text-[color:var(--color-neutral-100)]';

function Field({label, value}: {label: string; value: string}) {
  return (
    <div style={{display: 'flex', justifyContent: 'space-between', gap: 11.2, padding: '8.4px 0', borderBottom: '1px solid var(--hair-soft)', fontSize: 12.5}}>
      <span style={{color: 'var(--color-neutral-500)'}}>{label}</span>
      <span style={{fontWeight: 600, fontVariantNumeric: 'tabular-nums'}}>{value}</span>
    </div>
  );
}

/**
 * Card do DARF do mês. A emissão fica no Sicalc da Receita (TRA-93: gerar o
 * código de barras localmente produziria pagamento sem conciliação); aqui a
 * pessoa recebe os dados prontos para copiar.
 */
export function DarfHero({month}: {month: FiscalMonth | null}) {
  const toast = useAppToast();
  const [dialog, setDialog] = useState<'darf' | 'memo' | null>(null);

  if (!month) {
    return (
      <HeroFrame eyebrow="DARF do mês">
        <div style={{display: 'flex', alignItems: 'baseline', gap: 11.2, marginTop: 14}}>
          <span style={{fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em'}}>{formatCurrency(0)}</span>
          <span style={{fontSize: 12.5, color: 'var(--color-neutral-400)'}}>nenhuma venda apurada</span>
        </div>
        <div style={{fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 16.8, lineHeight: 1.5}}>
          Importe suas notas de corretagem ou o extrato da B3 para calcular o imposto mês a mês.
        </div>
      </HeroFrame>
    );
  }

  const due = darfDueDate(month);
  const code = darfCode(month);
  const period = `${String(month.month).padStart(2, '0')}/${month.year}`;
  const belowMinimum = month.totalTax > 0 && month.totalTax < DARF_MINIMUM;

  const copyDarfData = async () => {
    const text = `Código ${code} · Período de apuração ${period} · Vencimento ${due.toLocaleDateString('pt-BR')} · Valor ${formatCurrency(month.totalTax)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Dados copiados', 'Cole no Sicalc para emitir o DARF.');
    } catch {
      toast.error('Não foi possível copiar', text);
    }
  };

  return (
    <HeroFrame eyebrow={`DARF de ${monthName(month.month)} · vence ${formatDay(due)}`}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 11.2, marginTop: 14, flexWrap: 'wrap'}}>
        <span style={{fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums'}}>
          {formatCurrency(month.totalTax)}
        </span>
        <span style={{fontSize: 12.5, color: 'var(--color-neutral-400)'}}>
          {month.totalTax > 0 ? `código ${code} · ganho líquido` : 'sem imposto a pagar'}
        </span>
      </div>
      <div style={{display: 'flex', gap: 8.4, marginTop: 16.8, flexWrap: 'wrap'}}>
        <button
          type="button"
          onClick={() => setDialog('darf')}
          disabled={month.totalTax <= 0}
          className="hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-50"
          style={{height: 36, padding: '0 16.8px', borderRadius: 8, border: 'none', background: 'var(--grad-ember)', color: '#17140b', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer'}}>
          Gerar DARF
        </button>
        <button
          type="button"
          onClick={() => setDialog('memo')}
          className={outlineButtonClass}
          style={{height: 36, padding: '0 14px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--hair)', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer'}}>
          Ver memória de cálculo
        </button>
      </div>

      <Dialog open={dialog === 'darf'} onOpenChange={(open) => setDialog(open ? 'darf' : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir DARF de {monthName(month.month)}</DialogTitle>
            <DialogDescription>
              O DARF é emitido no Sicalc, da Receita Federal. Use os dados abaixo no formulário.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Field label="Código da receita" value={code} />
            <Field label="Período de apuração" value={period} />
            <Field label="Vencimento" value={due.toLocaleDateString('pt-BR')} />
            <Field label="Valor principal" value={formatCurrency(month.totalTax)} />
          </div>
          {belowMinimum && (
            <div style={{fontSize: 12, color: 'var(--warn)', lineHeight: 1.5}}>
              Valor abaixo de {formatCurrency(DARF_MINIMUM)}: a Receita não aceita o pagamento isolado. Some ao imposto do mês seguinte.
            </div>
          )}
          <div style={{fontSize: 11, color: 'var(--color-neutral-500)', lineHeight: 1.5}}>
            Vencimento calculado como último dia útil do mês seguinte, sem considerar feriados. Estimativa baseada nas operações importadas.
          </div>
          <div style={{display: 'flex', gap: 8.4, justifyContent: 'flex-end', flexWrap: 'wrap'}}>
            <button
              type="button"
              onClick={copyDarfData}
              className={outlineButtonClass}
              style={{height: 34, padding: '0 14px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--hair)', background: 'transparent', fontSize: 12.5, cursor: 'pointer'}}>
              Copiar dados
            </button>
            <a
              href={SICALC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:brightness-[1.08]"
              style={{height: 34, padding: '0 14px', borderRadius: 8, background: 'var(--grad-ember)', color: '#17140b', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', textDecoration: 'none'}}>
              Abrir o Sicalc
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === 'memo'} onOpenChange={(open) => setDialog(open ? 'memo' : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Memória de cálculo · {period}</DialogTitle>
            <DialogDescription>Preço médio ponderado, com as regras de isenção e compensação de prejuízo.</DialogDescription>
          </DialogHeader>
          <div>
            {buildCalcRows(month).map((row) => (
              <div key={row.label} style={{display: 'flex', justifyContent: 'space-between', gap: 11.2, padding: '8.4px 0', borderBottom: '1px solid var(--hair-soft)', fontSize: 12.5}}>
                <span style={{color: row.tone === 'total' ? 'var(--color-neutral-100)' : 'var(--color-neutral-400)'}}>{row.label}</span>
                <span style={{fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: toneColor[row.tone]}}>{row.value}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </HeroFrame>
  );
}

function HeroFrame({eyebrow, children}: {eyebrow: string; children: ReactNode}) {
  return (
    <section
      style={{
        position: 'relative',
        border: '1px solid rgba(240,179,46,0.32)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'linear-gradient(118deg, rgba(240,179,46,0.20) 0%, rgba(242,80,107,0.10) 55%, rgba(var(--rgb-surf-2),0.92) 100%), var(--surf-2)',
      }}>
      <div style={{padding: 22.4}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 8.4}}>
          <i className="ph-fill ph-receipt" style={{fontSize: 17, color: 'var(--warn)'}} aria-hidden />
          <span style={{fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f7d489'}}>{eyebrow}</span>
        </div>
        {children}
      </div>
    </section>
  );
}

export function MonthCalcCard({month}: {month: FiscalMonth | null}) {
  return (
    <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
      <div style={{padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)'}}>
        <h2 style={{fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, margin: 0}}>Apuração do mês</h2>
        <div style={{fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 2}}>Como o valor foi calculado, linha por linha</div>
      </div>
      <div style={{padding: '5.6px 0'}}>
        {month ? (
          buildCalcRows(month).map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 11.2,
                padding: '8.4px 16.8px',
                ...(row.tone === 'total' ? {borderTop: '1px solid var(--hair)', background: 'rgba(240,179,46,0.06)'} : {}),
              }}>
              <span style={{flex: 1, fontSize: 12.5, color: row.tone === 'total' ? 'var(--color-neutral-100)' : 'var(--color-neutral-400)'}}>
                {row.label}
              </span>
              <span style={{fontSize: 12.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: toneColor[row.tone]}}>{row.value}</span>
            </div>
          ))
        ) : (
          <div style={{padding: '8.4px 16.8px', fontSize: 12.5, color: 'var(--color-neutral-500)'}}>
            Sem vendas apuradas no período.
          </div>
        )}
      </div>
    </section>
  );
}
