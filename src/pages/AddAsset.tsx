import React, {useMemo, useRef, useState} from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {CalendarIcon} from '@/components/ui/icons';
import {useToast} from '@/components/ui/use-toast';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import PortfolioService from '@/services/portfolio';
import Stock from '@/services/stocks';
import {StockAllNacionalResponse} from '@/types/stock';
import {
  StockAutocompleteInput,
  type StockAutocompleteItem,
} from '@/components/stocks/StockAutocompleteInput';
import {normalizeStockSymbol} from '@/components/stocks/stock-autocomplete.utils';
import {SectionHeader} from '@/components/shared';

const IMPORT_STATUS_STYLE: Record<string, React.CSSProperties> = {
  success: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'var(--badge-pos-bg)', color: 'var(--pos)'},
  error: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'var(--badge-neg-bg)', color: 'var(--neg)'},
  pending: {padding: '2px 8px', borderRadius: 6, fontSize: 11, background: 'var(--badge-warn-bg)', color: 'var(--warn)'},
};

const INPUT_STYLE: React.CSSProperties = {
  height: 36,
  padding: '0 11.2px',
  border: '1px solid var(--hair)',
  borderRadius: 8,
  background: 'rgba(var(--rgb-bg),0.6)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontVariantNumeric: 'tabular-nums',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--color-neutral-400)',
};

export default function AddAsset() {
  const {toast} = useToast();
  const [date, setDate] = useState<Date>();
  const [symbolSearch, setSymbolSearch] = useState('');
  const normalizedSymbolSearch = String(symbolSearch || '').trim().toUpperCase();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: '',
  });

  const {data: portfolios} = useQuery({
    queryKey: ['portfolios'],
    queryFn: PortfolioService.getPortfolios,
  });

  const {data: stocksSearchData} = useQuery({
    queryKey: ['add-asset-stock-search', normalizedSymbolSearch],
    queryFn: async (): Promise<StockAllNacionalResponse> => {
      const response = await Stock.getAllNacionalStocks(normalizedSymbolSearch);
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

      const looksLikeTicker = /^[A-Z]{4}\d{1,2}F?$/.test(normalizedSymbolSearch);
      if (looksLikeTicker) {
        try {
          const quote = await Stock.getNationalStock(normalizedSymbolSearch);
          const item = quote?.results?.[0];
          const symbol = normalizeStockSymbol(item?.symbol || normalizedSymbolSearch);
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

      const looksLikeCompanyRoot = /^[A-Z]{4,6}$/.test(normalizedSymbolSearch);
      const hasPrefixMatch = stocks.some((s: any) =>
        normalizeStockSymbol(s?.stock || '').startsWith(normalizedSymbolSearch),
      );
      if (looksLikeCompanyRoot && !hasPrefixMatch) {
        const candidates = [`${normalizedSymbolSearch}3`, `${normalizedSymbolSearch}4`, `${normalizedSymbolSearch}11`];
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
    enabled: normalizedSymbolSearch.length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');

  const stockAutocompleteItems = useMemo(
    () =>
      (stocksSearchData?.stocks || []).map((s) => ({
        stock: s.stock,
        name: s.name,
        close: s.close,
        change: s.change,
        logo: s.logo,
        type: s.type,
      })),
    [stocksSearchData?.stocks],
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSymbolSelect = (s: StockAutocompleteItem) => {
    const normalizedSymbol = normalizeStockSymbol(s.stock);
    setSymbolSearch(normalizedSymbol);
    setFormData((prev) => ({
      ...prev,
      symbol: normalizedSymbol,
      name: s.name,
      type:
        s.type === 'fii'
          ? 'fii'
          : s.type === 'stock'
          ? 'stock'
          : prev.type,
      purchasePrice: s.close ? String(s.close) : prev.purchasePrice,
      currentPrice: s.close ? String(s.close) : prev.currentPrice,
    }));
  };

  const queryClient = useQueryClient();

  const addAssetMutation = useMutation({
    mutationFn: (assetData: any) =>
      PortfolioService.addAssetToPortfolio(selectedPortfolioId, assetData),
    onSuccess: () => {
      toast({
        title: 'Ativo adicionado!',
        description: `${formData.symbol} foi adicionado ao seu portfólio com sucesso.`,
      });

      queryClient.invalidateQueries({queryKey: ['portfolioAssets']});
      queryClient.invalidateQueries({queryKey: ['dashboardAssets']});
      queryClient.invalidateQueries({queryKey: ['portfolios']});

      setFormData({
        symbol: '',
        name: '',
        type: '',
        quantity: '',
        purchasePrice: '',
        currentPrice: '',
        purchaseDate: '',
      });
      setSymbolSearch('');
      setDate(undefined);
    },
    onError: () => {
      toast({
        title: 'Não foi possível adicionar o ativo',
        description: 'Revise as informações do ativo e tente novamente.',
        variant: 'destructive',
      });
    },
  });

  const doSubmit = () => {
    if (
      !formData.symbol ||
      !formData.type ||
      !formData.quantity ||
      !formData.purchasePrice ||
      !selectedPortfolioId
    ) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }
    addAssetMutation.mutate({
      symbol: formData.symbol,
      quantity: Number(formData.quantity),
      price: Number(formData.purchasePrice),
      type: formData.type,
      date: date ? date.toISOString() : undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    doSubmit();
  };

  const saveAndNew = () => {
    doSubmit();
  };

  const chooseFiles = () => fileInputRef.current?.click();

  const recentImports: Array<{id: string; icon: string; color: string; label: string; meta: string; status: string; statusLabel: string}> = [];

  return (
    <div style={{display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr)', gap: 16.8, alignItems: 'start'}}>

      {/* Manual form */}
      <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
        <SectionHeader title="Lançar manualmente" subtitle="Para ativos fora da B3 ou operações antigas" />
        <form onSubmit={handleSubmit}>
          <div style={{padding: 16.8, display: 'flex', flexDirection: 'column', gap: 14}}>

            {/* Symbol */}
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              <span style={LABEL_STYLE}>Símbolo do Ativo *</span>
              <StockAutocompleteInput
                value={symbolSearch}
                stocks={stockAutocompleteItems}
                placeholder="Ex: PETR4, VALE3..."
                onValueChange={(value) => {
                  setSymbolSearch(value);
                  handleInputChange('symbol', value);
                }}
                onSelect={(item) => handleSymbolSelect(item)}
              />
            </label>

            {/* Name */}
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              <span style={LABEL_STYLE}>Nome do Ativo</span>
              <input
                placeholder="Ex: Petrobras PN"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={INPUT_STYLE}
              />
            </label>

            {/* Type */}
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              <span style={LABEL_STYLE}>Tipo de Ativo *</span>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger style={{height: 36, borderRadius: 8, border: '1px solid var(--hair)', background: 'rgba(var(--rgb-bg),0.6)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: 13}}>
                  <SelectValue placeholder="Selecione o tipo de ativo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Ação</SelectItem>
                  <SelectItem value="fii">FII</SelectItem>
                  <SelectItem value="crypto">Criptomoeda</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </label>

            {/* Portfolio */}
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              <span style={LABEL_STYLE}>Portfólio *</span>
              <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                <SelectTrigger style={{height: 36, borderRadius: 8, border: '1px solid var(--hair)', background: 'rgba(var(--rgb-bg),0.6)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: 13}}>
                  <SelectValue placeholder="Escolha um portfólio" />
                </SelectTrigger>
                <SelectContent>
                  {portfolios &&
                    portfolios.map((p: any) => (
                      <SelectItem key={p.id || p._id} value={p.id || p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </label>

            {/* Quantity */}
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              <span style={LABEL_STYLE}>Quantidade *</span>
              <input
                type="number"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                required
                style={INPUT_STYLE}
              />
            </label>

            {/* Purchase Price */}
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              <span style={LABEL_STYLE}>Preço de Compra (R$) *</span>
              <input
                type="number"
                step="0.01"
                placeholder="25.50"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                required
                style={INPUT_STYLE}
              />
            </label>

            {/* Current Price */}
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              <span style={LABEL_STYLE}>Preço Atual (R$)</span>
              <input
                type="number"
                step="0.01"
                placeholder="28.75"
                value={formData.currentPrice}
                onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                style={INPUT_STYLE}
              />
            </label>

            {/* Date */}
            <label style={{display: 'flex', flexDirection: 'column', gap: 5.6}}>
              <span style={LABEL_STYLE}>Data de Compra</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    style={{...INPUT_STYLE, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'left'}}>
                    <CalendarIcon style={{width: 14, height: 14, flexShrink: 0}} />
                    <span style={{color: date ? 'var(--color-text)' : 'var(--color-neutral-600)'}}>
                      {date ? format(date, 'dd/MM/yyyy', {locale: ptBR}) : 'Selecionar data'}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent style={{width: 'auto', padding: 0}}>
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </label>

            <div style={{display: 'flex', gap: 8.4}}>
              <button type="submit" disabled={addAssetMutation.isPending} style={{flex: 1, height: 38, borderRadius: 8, border: 'none', background: 'var(--grad-violet)', color: 'var(--sunk)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: addAssetMutation.isPending ? 0.7 : 1}}>
                {addAssetMutation.isPending ? 'Salvando...' : 'Salvar ativo'}
              </button>
              <button type="button" onClick={saveAndNew} disabled={addAssetMutation.isPending} style={{height: 38, padding: '0 14px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-300)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer', opacity: addAssetMutation.isPending ? 0.7 : 1}}>
                Salvar e adicionar outro
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* Right: upload + recent imports */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
        {/* Dropzone */}
        <section style={{position: 'relative', border: '1px dashed rgba(145,132,217,0.45)', borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(122deg, rgba(111,94,217,0.24) 0%, rgba(76,201,240,0.10) 58%, rgba(var(--rgb-surf-2),0.86) 100%), var(--surf-2)'}}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.csv,.xlsx"
            style={{display: 'none'}}
          />
          <div style={{padding: '28px 22.4px', textAlign: 'center'}}>
            <div style={{width: 44, height: 44, margin: '0 auto', borderRadius: 8, background: 'var(--grad-aurora)', display: 'grid', placeItems: 'center', boxShadow: '0 0 28px var(--aurora-glow)'}}>
              <i className="ph-fill ph-upload-simple" style={{fontSize: 21, color: 'var(--sunk)'}} />
            </div>
            <div style={{fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 600, marginTop: 14}}>Arraste seus arquivos aqui</div>
            <div style={{fontSize: 12.5, color: 'var(--color-neutral-400)', lineHeight: 1.55, maxWidth: 420, margin: '5.6px auto 0'}}>
              PDF, CSV ou XLSX. Reconhecemos nota de corretagem, extrato de movimentação e relatório consolidado da B3 automaticamente.
            </div>
            <div style={{display: 'flex', gap: 8.4, justifyContent: 'center', marginTop: 16.8}}>
              <button type="button" onClick={chooseFiles} style={{height: 36, padding: '0 16.8px', borderRadius: 8, border: '1px solid var(--color-accent)', background: 'rgba(145,132,217,0.14)', color: 'var(--color-accent-100)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer'}}>
                Escolher arquivos
              </button>
              <button type="button" onClick={() => {}} style={{height: 36, padding: '0 16.8px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-200)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5.6}}>
                <i className="ph-fill ph-question" style={{fontSize: 14}} /> Qual arquivo eu preciso?
              </button>
            </div>
          </div>
        </section>

        {/* Recent imports */}
        <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
          <SectionHeader title="Importações recentes" />
          <div style={{padding: '5.6px 0'}}>
            {recentImports.length === 0 ? (
              <div style={{padding: '12px 16.8px', fontSize: 12.5, color: 'var(--color-neutral-600)'}}>
                Nenhuma importação recente.
              </div>
            ) : (
              recentImports.map((imp) => (
                <div key={imp.id} style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 16.8px'}}>
                  <i className={imp.icon} style={{fontSize: 16, color: imp.color}} />
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)'}}>{imp.label}</div>
                    <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>{imp.meta}</div>
                  </div>
                  <span style={IMPORT_STATUS_STYLE[imp.status]}>{imp.statusLabel}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
