import type {AdminUserCounts} from '@/interface/admin';

/**
 * Contagem de usuários do painel admin (TRA-192), no card de KPI do handoff
 * (`Trackerr Admin.dc.html`, bloco `kpis`).
 *
 * Só números: o server devolve contagens agregadas e nenhum dado pessoal.
 * `counts` ausente = server ainda sem o campo (web e API sobem em momentos
 * diferentes); mostra "—" em vez de zero para não afirmar um número falso.
 */
interface UserCountsCardsProps {
  counts?: AdminUserCounts;
  isLoading: boolean;
}

interface Kpi {
  label: string;
  value?: number;
  delta: string;
  deltaLabel: string;
}

const numberFormat = new Intl.NumberFormat('pt-BR');

/** Fatia dos ativos sobre o total de contas, ex.: "12% das contas". */
function shareOfTotal(active: number, total: number): string {
  if (total === 0) return '0% das contas';
  return `${Math.round((active / total) * 100)}% das contas`;
}

function buildKpis(counts?: AdminUserCounts): Kpi[] {
  const active = (label: string, value?: number): Kpi => ({
    label,
    value,
    delta: counts && value !== undefined ? shareOfTotal(value, counts.total) : '—',
    deltaLabel: '',
  });

  return [
    {
      label: 'Contas criadas',
      value: counts?.total,
      delta: counts ? `+${numberFormat.format(counts.newLast7Days)}` : '—',
      deltaLabel: 'nos últimos 7 dias',
    },
    active('Ativos em 24 h', counts?.activeLast24h),
    active('Ativos em 7 dias', counts?.activeLast7Days),
    active('Ativos em 30 dias', counts?.activeLast30Days),
  ];
}

export function UserCountsCards({counts, isLoading}: UserCountsCardsProps) {
  const kpis = buildKpis(counts);

  return (
    <section aria-label="Usuários" style={{display: 'flex', flexDirection: 'column', gap: 8.4}}>
      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        style={{gap: 16.8}}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              border: '1px solid var(--hair)',
              borderRadius: 8,
              padding: 16.8,
              background: 'var(--nk-card)',
            }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-neutral-500)',
              }}>
              {kpi.label}
            </div>
            <div
              data-testid={`user-kpi-${kpi.label}`}
              style={{
                marginTop: 8.4,
                fontFamily: 'var(--font-heading)',
                fontSize: 23,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}>
              {isLoading ? '...' : kpi.value === undefined ? '—' : numberFormat.format(kpi.value)}
            </div>
            <div
              style={{
                marginTop: 5.6,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                fontWeight: 500,
                color: 'var(--color-neutral-400)',
              }}>
              <span>{kpi.delta}</span>
              {kpi.deltaLabel ? (
                <span style={{color: 'var(--color-neutral-600)', fontWeight: 400}}>{kpi.deltaLabel}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      <p style={{margin: 0, fontSize: 11.5, color: 'var(--color-neutral-500)'}}>
        Ativos = login ou sessão renovada no período. A contagem de ativos começou quando esta métrica foi
        publicada; quem não voltou desde então ainda não aparece.
      </p>
    </section>
  );
}
