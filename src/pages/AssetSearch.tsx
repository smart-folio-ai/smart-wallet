import {useState, useEffect, useRef, useMemo} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {formatCurrency} from '@/utils/formatters';
import Stock from '@/services/stocks';
import {StockAllNacionalResponse} from '@/types/stock';
import {DataTable, TD_STYLE, TD_RIGHT, SectionHeader} from '@/components/shared';

interface Asset {
  stock: string;
  name: string;
  close: number;
  change: number;
  volume: number;
  market_cap: number | null;
  logo: string;
  sector: string;
  type: string;
}

const SCREENER_PRESETS = [
  {label: 'DY > 8%', term: 'dy'},
  {label: 'P/L < 10', term: 'pl'},
  {label: 'ROE > 15%', term: 'roe'},
  {label: 'FIIs', term: 'FII'},
  {label: 'Blue chips', term: 'PETR'},
];

const AssetSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search term before firing server-side query
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Full list (cached, used for the grid)
  const {data: allStocks, isLoading} = useQuery({
    queryKey: ['all-national-stocks'],
    queryFn: async (): Promise<StockAllNacionalResponse> => {
      const response = await Stock.getAllNacionalStocks();
      return Array.isArray(response) ? response[0] : response;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Server-side search — fires when user has typed ≥2 chars
  const {data: searchResults} = useQuery({
    queryKey: ['stock-search', debouncedSearch],
    queryFn: async (): Promise<StockAllNacionalResponse> => {
      const response = await Stock.getAllNacionalStocks(debouncedSearch);
      return Array.isArray(response) ? response[0] : response;
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 30 * 1000,
  });

  // Autocomplete: use server search results when available, fall back to local filter
  const suggestions = (() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    const source = searchResults?.stocks ?? allStocks?.stocks ?? [];
    return source
      .filter(
        (s) =>
          s.stock.toLowerCase().includes(q) ||
          (s.name && s.name.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        const aSymbol = a.stock.toLowerCase();
        const bSymbol = b.stock.toLowerCase();
        if (aSymbol === q && bSymbol !== q) return -1;
        if (bSymbol === q && aSymbol !== q) return 1;
        const aPrefix = aSymbol.startsWith(q);
        const bPrefix = bSymbol.startsWith(q);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        const aContains = aSymbol.includes(q);
        const bContains = bSymbol.includes(q);
        if (aContains && !bContains) return -1;
        if (bContains && !aContains) return 1;
        return aSymbol.localeCompare(bSymbol);
      })
      .slice(0, 8);
  })();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSuggestionClick = (symbol: string) => {
    setSearchTerm(symbol);
    setShowSuggestions(false);
    navigate(`/asset/${symbol}`);
  };

  // Flat list of all assets for screener table
  const allStocksFlat: Asset[] = useMemo(() => {
    const raw = Array.isArray(allStocks) ? (allStocks as StockAllNacionalResponse[])[0] : allStocks;
    return Array.isArray((raw as StockAllNacionalResponse | undefined)?.stocks)
      ? ((raw as StockAllNacionalResponse).stocks as Asset[])
      : [];
  }, [allStocks]);

  const filteredStocks: Asset[] = useMemo(() => {
    if (!debouncedSearch) return allStocksFlat;
    const q = debouncedSearch.toUpperCase();
    return allStocksFlat.filter(
      (a) =>
        a.stock?.toUpperCase().includes(q) ||
        a.name?.toUpperCase().includes(q) ||
        a.sector?.toUpperCase().includes(q) ||
        a.type?.toUpperCase().includes(q),
    );
  }, [allStocksFlat, debouncedSearch]);

  return (
    <div style={{maxWidth: 1200, margin: '0 auto', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 20}}>
      {/* Page title */}
      <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
        <i className="ph-fill ph-magnifying-glass" style={{fontSize: 18, color: 'var(--ac)'}} />
        <span style={{fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600}}>Buscar Ativos</span>
      </div>

      {/* Search bar */}
      <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
        <div ref={searchRef} style={{flex: 1, position: 'relative'}}>
          <i className="ph-fill ph-magnifying-glass" style={{position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--color-neutral-600)', pointerEvents: 'none'}} />
          <input
            value={searchTerm}
            onChange={e => {setSearchTerm(e.target.value); setShowSuggestions(true);}}
            onFocus={() => searchTerm && setShowSuggestions(true)}
            onKeyDown={e => {if (e.key === 'Escape') setShowSuggestions(false);}}
            placeholder="Buscar por ticker, nome ou critério…"
            style={{width: '100%', height: 46, paddingLeft: 38, paddingRight: searchTerm ? 36 : 12, border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surf-3)', fontSize: 13, outline: 'none', color: 'inherit', boxSizing: 'border-box'}}
          />
          {searchTerm && (
            <button type="button" onClick={() => {setSearchTerm(''); setShowSuggestions(false);}}
              style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-500)'}}>
              <i className="ph-fill ph-x" style={{fontSize: 14}} />
            </button>
          )}
          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{position: 'absolute', top: 50, left: 0, right: 0, zIndex: 50, border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--surf-2)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden'}}>
              {suggestions.map(s => (
                <button
                  key={s.stock}
                  type="button"
                  onMouseDown={() => handleSuggestionClick(s.stock)}
                  style={{width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit'}}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surf-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  {s.logo ? (
                    <img src={s.logo} alt={s.name} style={{width: 28, height: 28, borderRadius: 4, objectFit: 'contain', flexShrink: 0}}
                      onError={e => {(e.target as HTMLImageElement).style.display = 'none';}} />
                  ) : (
                    <div style={{width: 28, height: 28, borderRadius: 4, background: 'var(--surf-3)', flexShrink: 0}} />
                  )}
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontWeight: 600, fontSize: 13}}>{s.stock}</div>
                    <div style={{fontSize: 11.5, color: 'var(--color-neutral-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{s.name}</div>
                  </div>
                  <div style={{textAlign: 'right', flexShrink: 0}}>
                    <div style={{fontSize: 13, fontWeight: 500}}>{formatCurrency(s.close)}</div>
                    <div style={{fontSize: 11.5, color: s.change >= 0 ? 'var(--pos)' : 'var(--neg)'}}>
                      {s.change >= 0 ? '+' : ''}{s.change?.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button"
          style={{height: 46, padding: '0 20px', borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0}}>
          Buscar
        </button>
      </div>

      {/* Preset chips */}
      <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
        {SCREENER_PRESETS.map(p => (
          <button key={p.label} type="button" onClick={() => setSearchTerm(p.term)}
            style={{height: 28, padding: '0 12px', borderRadius: 14, border: '1px solid var(--hair)', background: 'transparent', fontSize: 11.5, color: 'var(--color-neutral-400)', cursor: 'pointer'}}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Results section */}
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader
          title="Screener"
          subtitle={`${filteredStocks.length} ativos encontrados`}
        />
        {isLoading ? (
          <div style={{padding: '28px 16px', textAlign: 'center', color: 'var(--color-neutral-600)'}}>Carregando…</div>
        ) : (
          <DataTable
            minWidth={820}
            columns={[
              {label: 'Ativo'},
              {label: 'Setor'},
              {label: 'Preço', align: 'right'},
              {label: 'Variação', align: 'right'},
              {label: 'Volume', align: 'right'},
              {label: 'Market Cap', align: 'right'},
            ]}>
            {filteredStocks.slice(0, 50).map(asset => (
              <tr key={asset.stock} onClick={() => navigate(`/asset/${asset.stock}`)}
                style={{cursor: 'pointer', borderTop: '1px solid var(--hair-soft)'}}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surf-3)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={TD_STYLE}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
                    {asset.logo && (
                      <img src={asset.logo} alt="" style={{width: 24, height: 24, borderRadius: 4, objectFit: 'contain'}}
                        onError={e => {(e.target as HTMLImageElement).style.display = 'none';}} />
                    )}
                    <span style={{fontWeight: 600, fontSize: 12.5}}>{asset.stock}</span>
                  </div>
                </td>
                <td style={TD_STYLE}>
                  <span style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>{asset.sector || '—'}</span>
                </td>
                <td style={TD_RIGHT}>{formatCurrency(asset.close)}</td>
                <td style={{...TD_RIGHT, color: asset.change >= 0 ? 'var(--pos)' : 'var(--neg)'}}>
                  {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
                </td>
                <td style={{...TD_RIGHT, color: 'var(--color-neutral-500)', fontSize: 11.5}}>
                  {asset.volume ? (asset.volume / 1e6).toFixed(1) + 'M' : '—'}
                </td>
                <td style={{...TD_RIGHT, color: 'var(--color-neutral-500)', fontSize: 11.5}}>
                  {asset.market_cap ? (asset.market_cap / 1e9).toFixed(1) + 'B' : '—'}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </div>
  );
};

export default AssetSearch;
