import {useMemo, useState} from 'react';
import {useNavigate, useParams, useSearchParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import portfolioService from '@/services/portfolio';
import {formatCurrency} from '@/utils';
import {DataTable, TD_STYLE, TD_RIGHT} from '@/components/shared';

type DividendEventType = 'JCP' | 'Dividendo';

interface DividendEvent {
  symbol: string;
  assetName: string;
  eventType: DividendEventType;
  date: string;
  quantity: number;
  valuePerUnit: number;
  totalValue: number;
  assetType: string;
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

const DividendDetail = () => {
  const navigate = useNavigate();
  const {symbol = ''} = useParams();
  const [searchParams] = useSearchParams();
  const portfolioId = searchParams.get('portfolioId') || 'all';
  const normalizedSymbol = symbol.toUpperCase();
  const [activeTab, setActiveTab] = useState<'all' | 'dividend' | 'jcp'>('all');
  const [groupBy, setGroupBy] = useState<'month' | 'year'>('month');

  const {data: portfolioPayload, isLoading} = useQuery({
    queryKey: ['dividends-detail', portfolioId],
    queryFn: async () => {
      if (!portfolioId || portfolioId === 'all') {
        return portfolioService.getAssets();
      }
      return portfolioService.getPortfolio(portfolioId);
    },
  });

  const apiAssets = useMemo(() => {
    if (!portfolioPayload) return [];
    if (Array.isArray(portfolioPayload)) return portfolioPayload;
    return portfolioPayload.assets ?? [];
  }, [portfolioPayload]);

  const events = useMemo<DividendEvent[]>(() => {
    return apiAssets
      .filter((asset: any) => String(asset?.symbol || '').toUpperCase() === normalizedSymbol)
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
            eventType,
            date: String(entry?.date || ''),
            quantity,
            valuePerUnit,
            totalValue: quantity * valuePerUnit,
            assetType: asset?.type || 'other',
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
  }, [apiAssets, normalizedSymbol]);

  const filteredEvents = useMemo(() => {
    if (activeTab === 'jcp') return events.filter((item) => item.eventType === 'JCP');
    if (activeTab === 'dividend') {
      return events.filter((item) => item.eventType === 'Dividendo');
    }
    return events;
  }, [activeTab, events]);

  const totalJcp = events
    .filter((event) => event.eventType === 'JCP')
    .reduce((sum, event) => sum + event.totalValue, 0);
  const totalDividend = events
    .filter((event) => event.eventType === 'Dividendo')
    .reduce((sum, event) => sum + event.totalValue, 0);
  const totalReceived = totalJcp + totalDividend;

  const headlineName = events[0]?.assetName || normalizedSymbol;

  const payoutChartData = useMemo(() => {
    const grouped = new Map<
      string,
      {label: string; order: number; dividend: number; jcp: number; total: number}
    >();

    events.forEach((event) => {
      const parsedDate = parseDate(event.date);
      if (!parsedDate) return;

      const year = parsedDate.getUTCFullYear();
      const month = parsedDate.getUTCMonth() + 1;
      const key = groupBy === 'year' ? `${year}` : `${year}-${String(month).padStart(2, '0')}`;
      const label =
        groupBy === 'year'
          ? `${year}`
          : parsedDate.toLocaleDateString('pt-BR', {
              month: 'short',
              year: '2-digit',
            });

      const current = grouped.get(key) || {
        label,
        order: parsedDate.getTime(),
        dividend: 0,
        jcp: 0,
        total: 0,
      };

      if (event.eventType === 'JCP') {
        current.jcp += event.totalValue;
      } else {
        current.dividend += event.totalValue;
      }
      current.total = current.dividend + current.jcp;
      current.order = Math.max(current.order, parsedDate.getTime());

      grouped.set(key, current);
    });

    return Array.from(grouped.values()).sort((a, b) => a.order - b.order);
  }, [events, groupBy]);

  return (
    <div style={{maxWidth: 1100, margin: '0 auto', padding: '32px 16px'}}>
      {/* Back button */}
      <div style={{marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12}}>
        <button
          type="button"
          onClick={() => navigate(`/dividends?portfolioId=${portfolioId}`)}
          style={{display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--color-neutral-400)'}}>
          <i className="ph-fill ph-arrow-left" style={{fontSize: 15}} />
          Voltar para dividendos
        </button>
      </div>

      {/* Hero card */}
      <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24, marginBottom: 24, overflow: 'hidden'}}>
        <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20}}>
          <div>
            <p style={{fontSize: 11, color: 'var(--color-neutral-500)', marginBottom: 4}}>Detalhes de proventos</p>
            <div style={{display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontFamily: 'var(--font-heading)', fontWeight: 700}}>
              <i className="ph-fill ph-buildings" style={{fontSize: 18, color: 'var(--ac)'}} />
              {normalizedSymbol}
            </div>
            <p style={{fontSize: 12.5, color: 'var(--color-neutral-500)', marginTop: 2}}>{headlineName}</p>
          </div>
          <span style={{padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 500, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-400)'}}>
            {events.length} evento(s)
          </span>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12}}>
          <div style={{borderRadius: 10, border: '1px solid rgba(145,132,217,0.35)', background: 'rgba(145,132,217,0.15)', padding: 16}}>
            <p style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ac)'}}>Total Recebido</p>
            <p style={{marginTop: 8, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-heading)'}}>{formatCurrency(totalReceived)}</p>
          </div>
          <div style={{borderRadius: 10, border: '1px solid rgba(76,201,240,0.30)', background: 'rgba(76,201,240,0.10)', padding: 16}}>
            <p style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cy)'}}>Total JCP</p>
            <p style={{marginTop: 8, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-heading)'}}>{formatCurrency(totalJcp)}</p>
          </div>
          <div style={{borderRadius: 10, border: '1px solid rgba(47,214,163,0.20)', background: 'rgba(47,214,163,0.20)', padding: 16}}>
            <p style={{fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--pos)'}}>Total Dividendos</p>
            <p style={{marginTop: 8, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-heading)'}}>{formatCurrency(totalDividend)}</p>
          </div>
        </div>
      </div>

      {/* Bar chart — CSS-grid implementation */}
      <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24, marginBottom: 24}}>
        <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16}}>
          <div>
            <span style={{fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600}}>Recebimentos por período</span>
            <p style={{fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 2}}>Visual mensal/anual de dividendos e JCP recebidos.</p>
          </div>
          <div style={{display: 'flex', gap: 4, background: 'var(--surf-3)', borderRadius: 8, padding: 3}}>
            {(['month', 'year'] as const).map((g) => (
              <button key={g} type="button" onClick={() => setGroupBy(g)}
                style={{padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  background: groupBy === g ? 'var(--ac)' : 'transparent',
                  color: groupBy === g ? '#fff' : 'var(--color-neutral-400)'}}>
                {g === 'month' ? 'Mensal' : 'Anual'}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <div style={{height: 200, borderRadius: 8, background: 'var(--surf-3)'}} />
        ) : payoutChartData.length === 0 ? (
          <div style={{border: '1px dashed var(--hair)', borderRadius: 8, padding: 24, fontSize: 13, color: 'var(--color-neutral-500)'}}>
            Sem dados suficientes para montar o gráfico.
          </div>
        ) : (() => {
          const maxTotal = Math.max(...payoutChartData.map(d => d.total), 1);
          return (
            <div style={{display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, overflowX: 'auto', paddingBottom: 4}}>
              {payoutChartData.map((d) => (
                <div key={d.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: '0 0 auto', minWidth: 36}}>
                  <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 1, height: 120, width: 24}}>
                    <div style={{borderRadius: '3px 3px 0 0', width: '100%', background: 'var(--pos)', height: `${(d.dividend / maxTotal) * 100}%`}} />
                    <div style={{borderRadius: '3px 3px 0 0', width: '100%', background: 'var(--cy)', height: `${(d.jcp / maxTotal) * 100}%`}} />
                  </div>
                  <span style={{fontSize: 9.5, color: 'var(--color-neutral-500)', whiteSpace: 'nowrap'}}>{d.label}</span>
                </div>
              ))}
            </div>
          );
        })()}
        {/* Legend */}
        {payoutChartData.length > 0 && (
          <div style={{display: 'flex', gap: 16, marginTop: 10, fontSize: 11}}>
            <span style={{display: 'flex', alignItems: 'center', gap: 4}}><span style={{width: 10, height: 10, borderRadius: 2, background: 'var(--pos)'}} />Dividendos</span>
            <span style={{display: 'flex', alignItems: 'center', gap: 4}}><span style={{width: 10, height: 10, borderRadius: 2, background: 'var(--cy)'}} />JCP</span>
          </div>
        )}
      </div>

      {/* History table */}
      <div style={{border: '1px solid var(--hair)', borderRadius: 12, background: 'var(--nk-card)', padding: 24}}>
        <div style={{marginBottom: 16}}>
          <span style={{fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 600}}>Historico completo de JCP e Dividendos</span>
          <p style={{fontSize: 11.5, color: 'var(--color-neutral-500)', marginTop: 4}}>Informacoes detalhadas por evento: data, quantidade, valor por unidade e total.</p>
        </div>

        {/* Filter tabs */}
        <div style={{display: 'flex', gap: 4, background: 'var(--surf-3)', borderRadius: 8, padding: 3, width: 'fit-content', marginBottom: 16}}>
          {(['all', 'dividend', 'jcp'] as const).map((t) => (
            <button key={t} type="button" onClick={() => setActiveTab(t)}
              style={{padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                background: activeTab === t ? 'var(--ac)' : 'transparent',
                color: activeTab === t ? '#fff' : 'var(--color-neutral-400)'}}>
              {t === 'all' ? 'Todos' : t === 'dividend' ? 'Dividendos' : 'JCP'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{height: 48, width: '100%', borderRadius: 8, background: 'var(--surf-3)'}} />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{border: '1px dashed var(--hair)', borderRadius: 8, padding: 24, fontSize: 13, color: 'var(--color-neutral-500)'}}>
            Nenhum evento encontrado para este filtro.
          </div>
        ) : (
          <DataTable
            columns={[
              {label: 'Data'},
              {label: 'Tipo'},
              {label: 'Quantidade', align: 'right'},
              {label: 'Valor por unidade', align: 'right'},
              {label: 'Total recebido', align: 'right'},
            ]}>
            {filteredEvents.map((event, index) => (
              <tr key={`${event.symbol}-${event.date}-${event.eventType}-${index}`} style={{borderTop: '1px solid var(--hair-soft)'}}>
                <td style={TD_STYLE}>{parseDate(event.date)?.toLocaleDateString('pt-BR') || '-'}</td>
                <td style={TD_STYLE}>
                  <span style={{padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-400)'}}>
                    {event.eventType}
                  </span>
                </td>
                <td style={TD_RIGHT}>{event.quantity}</td>
                <td style={TD_RIGHT}>{formatCurrency(event.valuePerUnit)}</td>
                <td style={{...TD_RIGHT, fontWeight: 600}}>{formatCurrency(event.totalValue)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
};

export default DividendDetail;
