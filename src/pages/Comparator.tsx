import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {formatCurrency} from '@/utils/formatters';
import {useSubscription} from '@/hooks/useSubscription';
import Stock from '@/services/stocks';
import {StockAutocompleteInput} from '@/components/stocks/StockAutocompleteInput';
import {normalizeStockSymbol} from '@/components/stocks/stock-autocomplete.utils';
import {DataTable, TD_STYLE, TD_RIGHT, SectionHeader} from '@/components/shared';

// ─── Module-level constants ────────────────────────────────────────────────

const KEY_MAP: Record<string, string> = {
  close: 'regularMarketPrice',
  change: 'regularMarketChangePercent',
  pl: 'priceEarnings',
  pvp: 'priceToBook',
  dy: 'dividendYield',
  roe: 'returnOnEquity',
  dividaPatrimonio: 'debtToEquity',
};

function getQuoteValue(
  quotesData: Record<string, any> | undefined,
  symbol: string,
  key: string,
): number | null {
  const q = quotesData?.[symbol];
  if (!q) return null;
  const mappedKey = KEY_MAP[key] ?? key;
  const val = q[mappedKey] ?? q?.quote?.[mappedKey];
  return typeof val === 'number' ? val : null;
}

const COMPARISON_ROWS: Array<{
  key: string;
  label: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
}> = [
  {key: 'close', label: 'Preço Atual', higherIsBetter: false, format: (v) => formatCurrency(v)},
  {key: 'change', label: 'Variação', higherIsBetter: true, format: (v) => `${v >= 0 ? '+' : ''}${v?.toFixed(2)}%`},
  {key: 'pl', label: 'P/L', higherIsBetter: false, format: (v) => v?.toFixed(1)},
  {key: 'pvp', label: 'P/VP', higherIsBetter: false, format: (v) => v?.toFixed(2)},
  {key: 'dy', label: 'Dividend Yield', higherIsBetter: true, format: (v) => `${v?.toFixed(1)}%`},
  {key: 'roe', label: 'ROE', higherIsBetter: true, format: (v) => `${v?.toFixed(1)}%`},
  {key: 'dividaPatrimonio', label: 'Dívida/Patrimônio', higherIsBetter: false, format: (v) => v?.toFixed(2)},
];

const RF_INSTRUMENTS = [
  {name: 'Tesouro IPCA+ 2029', kind: 'Tesouro', rate: 'IPCA+6.2%'},
  {name: 'CDB Banco Inter 110% CDI', kind: 'CDB', rate: '110% CDI'},
  {name: 'LCI Itaú 95% CDI', kind: 'LCI', rate: '95% CDI', exempt: true},
  {name: 'LCA Bradesco 93% CDI', kind: 'LCA', rate: '93% CDI', exempt: true},
  {name: 'CRI 13.5% a.a.', kind: 'CRI', rate: '13.5%', exempt: true},
];

// ─── Types ─────────────────────────────────────────────────────────────────

type SelectedAsset = {
  symbol: string;
  name: string;
  logo?: string;
};

type CompMode = 'equity' | 'fixed';

// ─── Page component ────────────────────────────────────────────────────────

export default function Comparator() {
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);
  const [inputValue, setInputValue] = useState('');
  const {hasComparator} = useSubscription();

  // Mode toggle state
  const [compMode, setCompMode] = useState<CompMode>('equity');

  // Renda Fixa form state (UI-only, no API)
  const [rfPrincipal, setRfPrincipal] = useState('10000');
  const [rfPrazo, setRfPrazo] = useState('24');
  const [rfIPCA, setRfIPCA] = useState('4.5');
  const [rfCDI, setRfCDI] = useState('10.5');

  const normalizedSearch = String(inputValue || '').trim().toUpperCase();

  const {data: stocksSearchData} = useQuery({
    queryKey: ['comparator-stock-search', normalizedSearch],
    queryFn: async () => {
      const response = await Stock.getAllNacionalStocks(normalizedSearch);
      const normalized = Array.isArray(response) ? response[0] : response;
      const stocks = Array.isArray(normalized?.stocks) ? [...normalized.stocks] : [];
      const pushIfMissing = (candidate: any) => {
        const symbol = normalizeStockSymbol(candidate?.stock || '');
        if (!symbol) return;
        if (stocks.some((s: any) => normalizeStockSymbol(s?.stock || '') === symbol)) {
          return;
        }
        stocks.unshift({
          stock: symbol,
          name: candidate?.name || symbol,
          close: Number(candidate?.close || 0),
          change: Number(candidate?.change || 0),
          logo: candidate?.logo || '',
          type: candidate?.type || 'stock',
        });
      };

      const looksLikeTicker = /^[A-Z]{4}\d{1,2}F?$/.test(normalizedSearch);
      if (looksLikeTicker) {
        try {
          const quote = await Stock.getNationalStock(normalizedSearch);
          const item = quote?.results?.[0];
          const symbol = normalizeStockSymbol(item?.symbol || normalizedSearch);
          pushIfMissing({
            stock: symbol,
            name: item?.longName || item?.shortName || symbol,
            close: Number(item?.regularMarketPrice || 0),
            change: Number(item?.regularMarketChangePercent || 0),
            logo: item?.logourl || '',
            type: 'stock',
          });
        } catch {
          // best effort
        }
      }

      const looksLikeCompanyRoot = /^[A-Z]{4,6}$/.test(normalizedSearch);
      const hasPrefixMatch = stocks.some((s: any) =>
        normalizeStockSymbol(s?.stock || '').startsWith(normalizedSearch),
      );
      if (looksLikeCompanyRoot && !hasPrefixMatch) {
        const candidates = [`${normalizedSearch}3`, `${normalizedSearch}4`, `${normalizedSearch}11`];
        const responses = await Promise.allSettled(
          candidates.map((symbol) => Stock.getNationalStock(symbol)),
        );
        for (const result of responses) {
          if (result.status !== 'fulfilled') continue;
          const item = result.value?.results?.[0];
          const symbol = normalizeStockSymbol(item?.symbol || '');
          if (!symbol) continue;
          pushIfMissing({
            stock: symbol,
            name: item?.longName || item?.shortName || symbol,
            close: Number(item?.regularMarketPrice || 0),
            change: Number(item?.regularMarketChangePercent || 0),
            logo: item?.logourl || '',
            type: 'stock',
          });
        }
      }

      return {
        ...normalized,
        stocks,
      };
    },
    enabled: normalizedSearch.length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  const autocompleteItems = useMemo(
    () =>
      (stocksSearchData?.stocks || []).map((item: any) => ({
        stock: item.stock,
        name: item.name,
        close: Number(item.close || 0),
        change: Number(item.change || 0),
        logo: item.logo || '',
        type: item.type,
      })),
    [stocksSearchData?.stocks],
  );

  const addAsset = (symbolOverride?: string) => {
    const symbol = normalizeStockSymbol(symbolOverride || inputValue || '');
    if (!symbol) return;
    if (selectedAssets.some((item) => item.symbol === symbol)) {
      setInputValue('');
      return;
    }

    const fromCatalog = autocompleteItems.find(
      (item) => normalizeStockSymbol(item.stock) === symbol,
    );
    setSelectedAssets((prev) => [
      ...prev,
      {
        symbol,
        name: fromCatalog?.name || 'Ativo',
        logo: fromCatalog?.logo || '',
      },
    ]);
    setInputValue('');
  };

  const removeAsset = (symbol: string) => {
    setSelectedAssets((prev) => prev.filter((asset) => asset.symbol !== symbol));
  };

  const symbolList = useMemo(
    () => selectedAssets.map((item) => item.symbol),
    [selectedAssets],
  );

  const {data: quotesData = {}} = useQuery({
    queryKey: ['comparator-quotes', symbolList.join('|')],
    queryFn: async () => {
      const entries = await Promise.all(
        symbolList.map(async (symbol) => {
          try {
            const response = await Stock.getNationalStock(symbol, {
              fundamental: true,
              dividends: true,
              range: '3mo',
              interval: '1d',
            });
            return [symbol, response?.results?.[0] || null] as const;
          } catch {
            return [symbol, null] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: symbolList.length > 0,
    staleTime: 3 * 60 * 1000,
  });

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 20}}>
      {/* Header row: title + mode toggle */}
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
          <i className="ph-fill ph-git-diff" style={{fontSize: 18, color: 'var(--ac)'}} />
          <span style={{fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600}}>Comparador</span>
        </div>
        {/* Mode toggle */}
        <div style={{display: 'inline-flex', border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden'}}>
          {([['equity', 'Renda Variável'], ['fixed', 'Renda Fixa']] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={compMode === mode}
              onClick={() => setCompMode(mode)}
              style={{
                padding: '7px 18px',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                background: compMode === mode ? 'var(--ac)' : 'transparent',
                color: compMode === mode ? '#fff' : 'var(--color-neutral-400)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {compMode === 'equity' ? (
        <>
          {/* Asset selector */}
          <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', padding: '14px 16px'}}>
            <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
              {selectedAssets.map((a) => (
                <div
                  key={a.symbol}
                  style={{display: 'flex', alignItems: 'center', gap: 6, height: 28, padding: '0 10px', borderRadius: 14, background: 'var(--badge-cy-bg)', color: 'var(--cy)', fontSize: 12}}>
                  {a.symbol}
                  <button
                    type="button"
                    onClick={() => removeAsset(a.symbol)}
                    style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cy)', padding: 0, display: 'flex'}}>
                    <i className="ph-fill ph-x" style={{fontSize: 11}} />
                  </button>
                </div>
              ))}
              {/* Autocomplete input */}
              <div style={{position: 'relative'}}>
                <StockAutocompleteInput
                  value={inputValue}
                  stocks={autocompleteItems}
                  placeholder="+ adicionar ativo"
                  onValueChange={setInputValue}
                  onSelect={(item) => addAsset(item.stock)}
                  onEnter={() => addAsset()}
                />
              </div>
            </div>
          </section>

          {/* Comparison table — PremiumBlur gate */}
          <PremiumBlur
            locked={!hasComparator}
            title="Comparador de Ativos — Premium"
            description="Acesse comparações detalhadas com mais de 20 indicadores financeiros">
            {selectedAssets.length > 0 && (
              <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
                <SectionHeader
                  title="Comparação lado a lado"
                  subtitle={`${selectedAssets.length} ativos selecionados`}
                />
                <DataTable
                  minWidth={720}
                  columns={[
                    {label: 'Indicador'},
                    ...selectedAssets.map((a) => ({label: a.symbol, align: 'right' as const})),
                  ]}>
                  {COMPARISON_ROWS.map((row) => {
                    const values = selectedAssets.map((a) =>
                      getQuoteValue(quotesData, a.symbol, row.key),
                    );
                    const numericValues = values.filter((v): v is number => v !== null);
                    const best =
                      numericValues.length > 0
                        ? row.higherIsBetter
                          ? Math.max(...numericValues)
                          : Math.min(...numericValues)
                        : null;
                    return (
                      <tr key={row.key} style={{borderTop: '1px solid var(--hair-soft)'}}>
                        <td style={TD_STYLE}>
                          <span style={{fontSize: 12.5, color: 'var(--color-neutral-400)'}}>{row.label}</span>
                        </td>
                        {selectedAssets.map((a) => {
                          const val = getQuoteValue(quotesData, a.symbol, row.key);
                          const isBest =
                            val !== null &&
                            best !== null &&
                            val === best &&
                            numericValues.length > 1;
                          return (
                            <td key={a.symbol} style={TD_RIGHT}>
                              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3}}>
                                {val !== null && best !== null && best !== 0 && (
                                  <div style={{width: 80, height: 4, borderRadius: 2, background: 'var(--sunk)', overflow: 'hidden'}}>
                                    <div
                                      style={{
                                        height: '100%',
                                        width: `${Math.min(Math.abs(val / best) * 100, 100)}%`,
                                        background: isBest ? 'var(--pos)' : 'var(--ac)',
                                        borderRadius: 2,
                                      }}
                                    />
                                  </div>
                                )}
                                <span
                                  style={{
                                    fontSize: 12.5,
                                    fontVariantNumeric: 'tabular-nums',
                                    fontWeight: isBest ? 600 : 400,
                                    color: isBest ? 'var(--pos)' : undefined,
                                  }}>
                                  {val !== null ? row.format(val) : '—'}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </DataTable>
              </section>
            )}
          </PremiumBlur>
        </>
      ) : (
        <>
          {/* Renda Fixa: Assumptions form */}
          <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', padding: '14px 16px'}}>
            <SectionHeader title="Parâmetros da simulação" />
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: '14px 16px'}}>
              {[
                {label: 'Principal (R$)', value: rfPrincipal, set: setRfPrincipal, placeholder: '10.000'},
                {label: 'Prazo (meses)', value: rfPrazo, set: setRfPrazo, placeholder: '24'},
                {label: 'IPCA (% a.a.)', value: rfIPCA, set: setRfIPCA, placeholder: '4.5'},
                {label: 'CDI (% a.a.)', value: rfCDI, set: setRfCDI, placeholder: '10.5'},
                {label: 'IR padrão (%)', value: '15', set: () => {}, placeholder: '15'},
              ].map((f) => (
                <div key={f.label}>
                  <label
                    style={{
                      fontSize: 10.5,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-neutral-600)',
                      display: 'block',
                      marginBottom: 5,
                    }}>
                    {f.label}
                  </label>
                  <input
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{
                      width: '100%',
                      height: 34,
                      border: '1px solid var(--hair)',
                      borderRadius: 6,
                      background: 'var(--surf-3)',
                      padding: '0 10px',
                      fontSize: 12.5,
                      color: 'inherit',
                      outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Fixed income comparison table */}
          <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
            <SectionHeader title="Renda fixa lado a lado" />
            <DataTable
              minWidth={900}
              columns={[
                {label: 'Ativo'},
                {label: 'Tipo'},
                {label: 'Taxa'},
                {label: 'Bruto', align: 'right'},
                {label: 'Imposto', align: 'right'},
                {label: 'Líquido', align: 'right'},
                {label: 'Real', align: 'right'},
                {label: 'Tag'},
              ]}>
              {RF_INSTRUMENTS.map((inst) => {
                const principal = parseFloat(rfPrincipal.replace(/\D/g, '')) || 10000;
                const months = parseInt(rfPrazo) || 24;
                const cdi = parseFloat(rfCDI) / 100;
                const ipca = parseFloat(rfIPCA) / 100;
                const bruto =
                  principal *
                    (1 +
                      (inst.rate.includes('CDI')
                        ? cdi * (parseFloat(inst.rate) / 100)
                        : ipca + 0.062)) **
                      (months / 12) -
                  principal;
                const ir = inst.exempt
                  ? 0
                  : bruto *
                    (months <= 6 ? 0.225 : months <= 12 ? 0.20 : months <= 24 ? 0.175 : 0.15);
                const liquido = bruto - ir;
                const real = liquido - principal * ((1 + ipca) ** (months / 12) - 1);
                const pct = (liquido / principal) * 100;
                const maxPct = 25;
                return (
                  <tr key={inst.name} style={{borderTop: '1px solid var(--hair-soft)'}}>
                    <td style={TD_STYLE}>
                      <span style={{fontSize: 12.5, fontWeight: 500}}>{inst.name}</span>
                    </td>
                    <td style={TD_STYLE}>
                      <span style={{fontSize: 11, padding: '2px 7px', borderRadius: 10, background: 'var(--badge-cy-bg)', color: 'var(--cy)'}}>
                        {inst.kind}
                      </span>
                    </td>
                    <td style={TD_STYLE}>
                      <span style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>{inst.rate}</span>
                    </td>
                    <td style={TD_RIGHT}>{formatCurrency(bruto)}</td>
                    <td style={{...TD_RIGHT, color: 'var(--neg)'}}>
                      {inst.exempt ? 'Isento' : formatCurrency(ir)}
                    </td>
                    <td style={TD_RIGHT}>
                      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3}}>
                        <div style={{width: 80, height: 4, borderRadius: 2, background: 'var(--sunk)', overflow: 'hidden'}}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min((pct / maxPct) * 100, 100)}%`,
                              background: 'var(--pos)',
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <span style={{fontVariantNumeric: 'tabular-nums', fontSize: 12.5}}>
                          {formatCurrency(liquido)}
                        </span>
                      </div>
                    </td>
                    <td style={{...TD_RIGHT, color: real >= 0 ? 'var(--pos)' : 'var(--neg)', fontSize: 12}}>
                      {formatCurrency(real)}
                    </td>
                    <td style={TD_STYLE}>
                      {inst.exempt && (
                        <span style={{fontSize: 10.5, padding: '2px 7px', borderRadius: 10, background: 'var(--badge-pos-bg)', color: 'var(--pos)'}}>
                          Isento IR
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          </section>

          {/* AI verdict + IR regressive table */}
          <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)', gap: 16}}>
            {/* AI verdict */}
            <div
              style={{
                border: '1px solid rgba(145,132,217,0.35)',
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(111,94,217,0.24) 0%, rgba(76,201,240,0.10) 100%)',
                padding: '16px',
              }}>
              <div style={{display: 'flex', gap: 8, alignItems: 'flex-start'}}>
                <i className="ph-fill ph-sparkle" style={{fontSize: 16, color: 'var(--ac)', flexShrink: 0, marginTop: 2}} />
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                  <div style={{fontSize: 13, fontWeight: 600}}>
                    Para {rfPrazo} meses com R$ {Number(rfPrincipal).toLocaleString('pt-BR')}
                  </div>
                  <ul style={{margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 5}}>
                    <li style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>
                      CDB 110% CDI tende a superar LCI em prazos acima de 24 meses.
                    </li>
                    <li style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>
                      LCI/LCA isentos de IR são vantajosos em alíquotas de 20–22,5%.
                    </li>
                    <li style={{fontSize: 12, color: 'var(--color-neutral-400)'}}>
                      Tesouro IPCA+ protege contra inflação acima de {rfIPCA}% a.a.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* IR regressive table */}
            <div style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)', padding: '14px 16px'}}>
              <div style={{fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, marginBottom: 12}}>
                IR Regressivo
              </div>
              {[
                {prazo: 'Até 6 meses', aliq: '22,5%'},
                {prazo: '6 a 12 meses', aliq: '20,0%'},
                {prazo: '12 a 24 meses', aliq: '17,5%'},
                {prazo: 'Acima de 24 meses', aliq: '15,0%'},
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderTop: i > 0 ? '1px solid var(--hair-soft)' : undefined,
                    fontSize: 12,
                  }}>
                  <span style={{color: 'var(--color-neutral-500)'}}>{row.prazo}</span>
                  <span style={{fontVariantNumeric: 'tabular-nums', color: 'var(--neg)'}}>{row.aliq}</span>
                </div>
              ))}
              <div style={{marginTop: 10, fontSize: 10.5, color: 'var(--color-neutral-600)', lineHeight: 1.5}}>
                LCI, LCA, CRI e CRA são isentos de IR para pessoa física.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
