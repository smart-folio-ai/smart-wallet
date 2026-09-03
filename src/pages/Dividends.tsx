import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import portfolioService from '@/services/portfolio';
import {formatCurrency} from '@/utils';
import {
  KpiCard,
  SectionHeader,
  AiInsightBanner,
  DataTable,
  TD_STYLE,
  TD_RIGHT,
} from '@/components/shared';

type DividendEventType = 'JCP' | 'Dividendo';

interface DividendEvent {
  symbol: string;
  assetName: string;
  assetType: string;
  eventType: DividendEventType;
  date: string;
  quantity: number;
  valuePerUnit: number;
  totalValue: number;
}

const normalizeDividendEventType = (value: unknown): DividendEventType => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  if (
    normalized.includes('jcp') ||
    normalized.includes('juros sobre capital') ||
    normalized.includes('juros')
  ) {
    return 'JCP';
  }

  if (
    normalized.includes('dividend') ||
    normalized.includes('rendimento') ||
    normalized.includes('provento') ||
    normalized.includes('rend')
  ) {
    return 'Dividendo';
  }

  return 'Dividendo';
};

const parseDate = (dateValue: unknown): Date | null => {
  if (!dateValue) return null;
  const parsed = new Date(String(dateValue));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const MONTH_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const formatPercent = (value: number | null | undefined): string =>
  value === null || value === undefined || !Number.isFinite(value)
    ? '—'
    : `${value.toFixed(2)}%`;

const Dividends = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('all');

  const {data: portfolios = []} = useQuery({
    queryKey: ['portfolios'],
    queryFn: async () => portfolioService.getPortfolios(),
  });

  useEffect(() => {
    const fromUrl = searchParams.get('portfolioId');
    if (fromUrl) {
      setSelectedPortfolioId(fromUrl);
      return;
    }

    if (portfolios.length > 0 && selectedPortfolioId === 'all') {
      setSelectedPortfolioId('all');
    }
  }, [portfolios, searchParams, selectedPortfolioId]);

  const {data: portfolioPayload, isLoading} = useQuery({
    queryKey: ['dividends-portfolio', selectedPortfolioId],
    queryFn: async () => {
      if (!selectedPortfolioId || selectedPortfolioId === 'all') {
        return portfolioService.getAssets();
      }
      return portfolioService.getPortfolio(selectedPortfolioId);
    },
  });

  const apiAssets = useMemo(() => {
    if (!portfolioPayload) return [];
    if (Array.isArray(portfolioPayload)) return portfolioPayload;
    return (portfolioPayload as {assets?: unknown[]}).assets ?? [];
  }, [portfolioPayload]);

  const allDividendEvents = useMemo<DividendEvent[]>(() => {
    return (apiAssets as any[])
      .flatMap((asset: any) => {
        const quantity = Number(asset?.quantity || 0);
        const history = Array.isArray(asset?.dividendHistory)
          ? asset.dividendHistory
          : [];

        return history.map((entry: any) => {
          const valuePerUnit = Number(entry?.value || 0);
          const eventType = normalizeDividendEventType(
            entry?.type ||
              entry?.eventType ||
              entry?.paymentType ||
              entry?.kind ||
              entry?.description,
          );

          return {
            symbol: String(asset?.symbol || '').toUpperCase(),
            assetName: asset?.name || asset?.longName || asset?.symbol || '-',
            assetType: asset?.type || 'other',
            eventType,
            date: String(entry?.date || ''),
            quantity,
            valuePerUnit,
            totalValue: valuePerUnit * quantity,
          };
        });
      })
      .sort((a, b) => {
        const bDate = parseDate(b.date);
        const aDate = parseDate(a.date);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate.getTime() - aDate.getTime();
      });
  }, [apiAssets]);

  // ── Derived data for Nocturne layout ──────────────────────────────────────

  const now = useMemo(() => new Date(), []);
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  /** 12 months: 9 past + current + 2 future (oldest → newest), projected = future */
  const monthlyData = useMemo(() => {
    const result: {label: string; value: number; projected: boolean}[] = [];
    for (let i = 9; i >= -2; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth();
      const label = MONTH_LABELS[mo];
      const isProjected = yr > currentYear || (yr === currentYear && mo > currentMonthIdx);
      const value = isProjected
        ? 0
        : allDividendEvents
            .filter((ev) => {
              const parsed = parseDate(ev.date);
              return parsed && parsed.getFullYear() === yr && parsed.getMonth() === mo;
            })
            .reduce((sum, ev) => sum + ev.totalValue, 0);
      result.push({label, value, projected: isProjected});
    }
    return result;
  }, [allDividendEvents, currentMonthIdx, currentYear]);

  const maxMonthValue = useMemo(
    () => Math.max(...monthlyData.map((m) => m.value), 1),
    [monthlyData],
  );

  const currentMonthLabel = MONTH_LABELS[currentMonthIdx];

  /** Upcoming 45-day agenda from dividend events with future/today pay dates */
  const agenda = useMemo(() => {
    const cutoff = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    return allDividendEvents
      .filter((ev) => {
        const d = parseDate(ev.date);
        return d && d >= now && d <= cutoff;
      })
      .map((ev) => {
        const d = parseDate(ev.date)!;
        return {
          symbol: ev.symbol,
          day: String(d.getDate()).padStart(2, '0'),
          month: MONTH_LABELS[d.getMonth()],
          type: ev.eventType,
          comDate: d.toLocaleDateString('pt-BR'),
          value: formatCurrency(ev.totalValue),
          perShare: `${formatCurrency(ev.valuePerUnit)}/cota`,
        };
      });
  }, [allDividendEvents, now]);

  /** Per-symbol snapshot (current value, cost basis, backend-provided DY) used for DY/YoC math */
  const assetInfoBySymbol = useMemo(() => {
    const map = new Map<string, {value: number; costBasis: number; dividendYield?: number}>();
    (apiAssets as any[]).forEach((asset: any) => {
      const symbol = String(asset?.symbol || '').toUpperCase();
      if (!symbol) return;
      const quantity = Number(asset?.quantity || 0);
      const avgPrice = Number(asset?.avgPrice ?? asset?.price ?? 0);
      const value = Number(asset?.total ?? quantity * (asset?.currentPrice ?? asset?.price ?? 0));
      const dividendYield =
        typeof asset?.indicators?.dividendYield === 'number'
          ? asset.indicators.dividendYield
          : undefined;
      map.set(symbol, {value, costBasis: quantity * avgPrice, dividendYield});
    });
    return map;
  }, [apiAssets]);

  const totalPortfolioValue = useMemo(
    () => Array.from(assetInfoBySymbol.values()).reduce((sum, a) => sum + a.value, 0),
    [assetInfoBySymbol],
  );

  const totalCostBasis = useMemo(
    () => Array.from(assetInfoBySymbol.values()).reduce((sum, a) => sum + a.costBasis, 0),
    [assetInfoBySymbol],
  );

  /** Income grouped by asset symbol */
  const incomeByAsset = useMemo(() => {
    const map = new Map<string, {total: number; count: number}>();
    allDividendEvents.forEach((ev) => {
      const cur = map.get(ev.symbol) ?? {total: 0, count: 0};
      map.set(ev.symbol, {total: cur.total + ev.totalValue, count: cur.count + 1});
    });
    return Array.from(map.entries())
      .map(([symbol, {total, count}]) => {
        const info = assetInfoBySymbol.get(symbol);
        const dy = formatPercent(info?.dividendYield);
        const yoc =
          info && info.costBasis > 0 ? formatPercent((total / info.costBasis) * 100) : '—';
        return {symbol, total, dy, yoc, count};
      })
      .sort((a, b) => b.total - a.total);
  }, [allDividendEvents, assetInfoBySymbol]);

  /** Last-12-months total and previous-year total for growth delta */
  const total12m = useMemo(() => {
    const from = new Date(currentYear - 1, currentMonthIdx + 1, 1);
    const to = new Date(currentYear, currentMonthIdx + 1, 1);
    return allDividendEvents
      .filter((ev) => {
        const d = parseDate(ev.date);
        return d && d >= from && d < to;
      })
      .reduce((sum, ev) => sum + ev.totalValue, 0);
  }, [allDividendEvents, currentMonthIdx, currentYear]);

  const prev12m = useMemo(() => {
    const from = new Date(currentYear - 2, currentMonthIdx + 1, 1);
    const to = new Date(currentYear - 1, currentMonthIdx + 1, 1);
    return allDividendEvents
      .filter((ev) => {
        const d = parseDate(ev.date);
        return d && d >= from && d < to;
      })
      .reduce((sum, ev) => sum + ev.totalValue, 0);
  }, [allDividendEvents, currentMonthIdx, currentYear]);

  const growth12m = prev12m > 0
    ? `${total12m >= prev12m ? '+' : ''}${(((total12m - prev12m) / prev12m) * 100).toFixed(1)}%`
    : undefined;

  const growth = prev12m > 0 ? total12m - prev12m : 0;

  // DY médio da carteira: mesma definição usada em Portfolio.tsx (`dividendYield`) e
  // Index.tsx (`estimatedDividendYieldPct`) — proventos recebidos no período / valor total da carteira.
  const avgDY =
    totalPortfolioValue > 0 ? formatPercent((total12m / totalPortfolioValue) * 100) : '—';

  // Yield on Cost: proventos recebidos / custo de aquisição (preço médio pago), não sobre a cotação atual.
  const yoc =
    totalCostBasis > 0
      ? formatPercent(
          (allDividendEvents.reduce((sum, ev) => sum + ev.totalValue, 0) / totalCostBasis) * 100,
        )
      : '—';

  const nextDiv = useMemo(() => {
    const upcoming = allDividendEvents
      .filter((ev) => {
        const d = parseDate(ev.date);
        return d && d >= now;
      })
      .sort((a, b) => {
        const da = parseDate(a.date)!;
        const db = parseDate(b.date)!;
        return da.getTime() - db.getTime();
      });
    if (upcoming.length === 0) return {value: '—', symbol: '—', payDate: '—'};
    const nxt = upcoming[0];
    const d = parseDate(nxt.date)!;
    return {
      value: formatCurrency(nxt.totalValue),
      symbol: nxt.symbol,
      payDate: d.toLocaleDateString('pt-BR'),
    };
  }, [allDividendEvents, now]);

  const fiisTotal = useMemo(
    () =>
      allDividendEvents
        .filter((ev) => ev.assetType?.toLowerCase().includes('fii'))
        .reduce((s, ev) => s + ev.totalValue, 0),
    [allDividendEvents],
  );

  const passiveIncomeInsight = useMemo(() => {
    if (total12m <= 0)
      return {text: 'Ainda não há proventos registrados para análise de renda passiva.'};
    const fiisShare = total12m > 0 ? ((fiisTotal / total12m) * 100).toFixed(0) : '0';
    return {
      text: `Suas FIIs geraram ${fiisShare}% do total de proventos nos últimos 12 meses. Diversificar entre FIIs, ações e BDRs pode melhorar a consistência da renda.`,
    };
  }, [total12m, fiisTotal]);

  const showAdvancedInsight = true;

  const chartSubtitle = `${MONTH_LABELS[(currentMonthIdx + 1) % 12].toUpperCase()} ${currentYear - 1} – ${MONTH_LABELS[currentMonthIdx].toUpperCase()} ${currentYear}`;
  const tableSubtitle = `${allDividendEvents.length} evento${allDividendEvents.length !== 1 ? 's' : ''} registrado${allDividendEvents.length !== 1 ? 's' : ''}`;

  // ── JSX ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return <div style={{padding: 24, color: 'var(--color-neutral-500)'}}>Carregando...</div>;
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>

      {/* 1. KPI cards */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 11.2}}>
        <KpiCard label="DY médio" value={avgDY} sub="ponderado por posição" />
        <KpiCard
          label="Proventos 12m"
          value={formatCurrency(total12m)}
          delta={growth12m}
          sub="vs ano anterior"
          deltaStyle={{color: growth >= 0 ? 'var(--pos)' : 'var(--neg)'}}
        />
        <KpiCard
          label="Yield on Cost"
          value={yoc}
          sub="sobre preço médio pago"
          tooltip={{title: 'Yield on Cost', body: 'Rendimento sobre o custo histórico de aquisição', formula: 'YoC = Proventos acumulados / Custo médio total × 100'}}
        />
        <KpiCard label="Próximo provento" value={nextDiv.value} sub={`${nextDiv.symbol} · pag. ${nextDiv.payDate}`} />
      </div>

      {/* 2. Bar chart — Proventos por mês */}
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader
          title="Proventos recebidos por mês"
          subtitle={chartSubtitle}
          action={
            <div style={{display: 'flex', gap: 14}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 11, color: 'var(--color-neutral-400)'}}>
                <span style={{width: 10, height: 10, borderRadius: 2, background: 'var(--pos)', display: 'inline-block'}} /> recebido
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: 5.6, fontSize: 11, color: 'var(--color-neutral-400)'}}>
                <span style={{width: 10, height: 10, borderRadius: 2, background: 'rgba(145,132,217,0.45)', border: '1px dashed var(--color-accent-400)', display: 'inline-block'}} /> previsto
              </div>
            </div>
          }
        />
        <div style={{padding: 16.8}}>
          {/* 12-bar CSS grid chart */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8.4, alignItems: 'end', height: 168}}>
            {monthlyData.map((m) => (
              <div key={m.label} style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: 5.6}}>
                <span style={{fontSize: 10, color: 'var(--color-neutral-500)', textAlign: 'center', fontVariantNumeric: 'tabular-nums'}}>
                  {m.label === currentMonthLabel ? formatCurrency(m.value) : ''}
                </span>
                <div
                  style={{
                    background: m.projected ? 'rgba(145,132,217,0.45)' : 'var(--pos)',
                    borderRadius: '3px 3px 0 0',
                    height: `${(m.value / maxMonthValue) * 100}%`,
                    border: m.projected ? '1px dashed var(--color-accent-400)' : 'none',
                    minHeight: m.value > 0 ? 4 : 0,
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8.4, marginTop: 8.4}}>
            {monthlyData.map((m) => (
              <span key={m.label} style={{fontSize: 10.5, color: 'var(--color-neutral-600)', textAlign: 'center'}}>{m.label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Agenda + Renda por ativo */}
      <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 16.8, alignItems: 'start'}}>
        <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
          <SectionHeader title="Agenda · próximos 45 dias" subtitle="Data-com, pagamento e valor líquido previsto" />
          <div style={{padding: '5.6px 0'}}>
            {agenda.length === 0 ? (
              <div style={{padding: '16.8px', fontSize: 12.5, color: 'var(--color-neutral-600)', textAlign: 'center'}}>
                Nenhum provento previsto para os próximos 45 dias.
              </div>
            ) : (
              agenda.map((d) => (
                <div key={`${d.symbol}-${d.comDate}`} style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 16.8px'}}>
                  <div style={{width: 38, flexShrink: 0, textAlign: 'center', border: '1px solid var(--hair)', borderRadius: 6, padding: '4px 0', background: 'rgba(var(--rgb-bg),0.6)'}}>
                    <div style={{fontSize: 13, fontWeight: 600, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{d.day}</div>
                    <div style={{fontSize: 9, color: 'var(--color-neutral-600)', textTransform: 'uppercase', letterSpacing: '0.06em'}}>{d.month}</div>
                  </div>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontSize: 12.5, fontWeight: 600}}>{d.symbol}</div>
                    <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)'}}>{d.type} · data-com {d.comDate}</div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--pos)', fontVariantNumeric: 'tabular-nums'}}>{d.value}</div>
                    <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', fontVariantNumeric: 'tabular-nums'}}>{d.perShare}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
          <SectionHeader
            title="Renda por ativo · 12 meses"
            subtitle={tableSubtitle}
            action={
              <button
                type="button"
                style={{height: 30, padding: '0 11.2px', border: '1px solid var(--color-accent-700)', borderRadius: 8, background: 'transparent', color: 'var(--color-accent-200)', fontSize: 11.5, cursor: 'pointer', fontFamily: 'var(--font-body)'}}
              >
                Informe de rendimentos
              </button>
            }
          />
          <DataTable
            minWidth={560}
            columns={[
              {label: 'Ativo'}, {label: 'Total R$', align: 'right'}, {label: 'DY', align: 'right'},
              {label: 'YoC', align: 'right'}, {label: 'Nº', align: 'right'},
            ]}
          >
            {incomeByAsset.map((r) => (
              <tr key={r.symbol} style={{borderTop: '1px solid var(--hair-soft)'}} className="hover:bg-[rgba(145,132,217,0.06)]">
                <td style={{...TD_STYLE, fontWeight: 600}}>{r.symbol}</td>
                <td style={TD_RIGHT}>{formatCurrency(r.total)}</td>
                <td style={TD_RIGHT}>{r.dy}</td>
                <td style={{...TD_RIGHT, fontWeight: 600, color: 'var(--pos)'}}>{r.yoc}</td>
                <td style={{...TD_RIGHT, color: 'var(--color-neutral-500)'}}>{r.count}</td>
              </tr>
            ))}
          </DataTable>
        </section>
      </div>

      {/* 4. AI banner */}
      {showAdvancedInsight && (
        <AiInsightBanner
          text={passiveIncomeInsight.text}
          actionLabel="Abrir planejamento"
          onAction={() => navigate('/planning')}
        />
      )}
    </div>
  );
};

export default Dividends;
