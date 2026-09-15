import React, {useCallback, useMemo, useReducer, useRef, useState} from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {CalendarIcon} from '@/components/ui/icons';
import useAppToast from '@/hooks/use-app-toast';
import {Calendar} from '@/components/ui/calendar';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {format} from 'date-fns';
import {ptBR} from 'date-fns/locale';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import PortfolioService from '@/services/portfolio';
import {brokerSyncService} from '@/server/api/api';
import Stock from '@/services/stocks';
import {StockAllNacionalResponse} from '@/types/stock';
import {
  StockAutocompleteInput,
  type StockAutocompleteItem,
} from '@/components/stocks/StockAutocompleteInput';
import {normalizeStockSymbol} from '@/components/stocks/stock-autocomplete.utils';
import {SectionHeader} from '@/components/shared';
import {B3ImportGuideModal} from '@/components/portfolio/B3ImportGuideModal';

type SessionImport = {
  name: string;
  status: 'pending' | 'success' | 'error';
  summary?: string;
  warnings?: string[];
};

type SessionImportAction =
  | {type: 'start'; name: string}
  | {type: 'done'; name: string; summary: string; warnings?: string[]}
  | {type: 'fail'; name: string; summary: string};

function sessionImportsReducer(
  state: SessionImport[],
  action: SessionImportAction,
): SessionImport[] {
  if (action.type === 'start') {
    return [{name: action.name, status: 'pending'}, ...state];
  }
  const index = state.findIndex(
    (item) => item.name === action.name && item.status === 'pending',
  );
  if (index === -1) return state;
  const next = [...state];
  next[index] = {
    name: action.name,
    status: action.type === 'done' ? 'success' : 'error',
    summary: action.summary,
    warnings: action.type === 'done' ? action.warnings : undefined,
  };
  return next;
}

const isPdf = (file: File) =>
  file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');

const normalizeFileName = (name: string) =>
  name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * Consolidado primeiro (cria as posições), negociação depois, movimentação
 * por último: os proventos datados da movimentação só se prendem a ativos
 * que já existem na carteira — importada antes do consolidado, ela descarta
 * os proventos por não achar os papéis.
 */
function sortB3Files(files: File[]): File[] {
  const rank = (file: File) => {
    const name = normalizeFileName(file.name);
    if (name.includes('consolidado') || name.includes('relatorio')) return 0;
    if (name.includes('movimentacao')) return 2;
    return 1;
  };
  return [...files].sort((a, b) => rank(a) - rank(b));
}

function summarizeB3Import(result: any): string {
  if (result?.kind === 'upcoming') {
    const count = Number(result?.eventsImported ?? 0);
    if (!count) return result?.message || 'Nenhum provento previsto no arquivo.';
    const total = Number(result?.totalNetValue ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return `${count} provento(s) a receber · ${total} previstos`;
  }
  if (result?.kind === 'transactions') {
    const imported = Number(result?.tradesImported ?? 0);
    if (!imported && !result?.totalParsed) {
      return result?.message || 'Nenhuma operação encontrada no arquivo.';
    }
    const duplicates = Number(result?.ignoredDuplicates ?? 0);
    return `${imported} operação(ões) importada(s)${duplicates ? `, ${duplicates} já existiam` : ''}`;
  }

  const parts: string[] = [];
  const created = Number(result?.assetsCreated ?? 0);
  const updated = Number(result?.assetsUpdated ?? 0);
  if (created) parts.push(`${created} ativo(s) criado(s)`);
  if (updated) parts.push(`${updated} atualizado(s)`);
  const dividends = Number(result?.dividendsAttachedToExistingAssets ?? 0);
  if (dividends) parts.push(`proventos em ${dividends} ativo(s)`);
  return parts.length ? parts.join(', ') : result?.message || 'Arquivo importado';
}

const IMPORT_KIND_LABEL: Record<string, string> = {
  brokerage_note: 'Nota de corretagem',
  b3_report: 'Relatório B3',
  b3_transactions: 'Extrato de negociação B3',
  b3_events: 'Eventos B3',
};

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
  const toast = useAppToast();
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
      toast.success('Ativo adicionado!', `${formData.symbol} foi adicionado ao seu portfólio com sucesso.`);

      queryClient.invalidateQueries();

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
      toast.error('Não foi possível adicionar o ativo', 'Revise as informações do ativo e tente novamente.');
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
      toast.error('Erro', 'Por favor, preencha todos os campos obrigatórios.');
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

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [sessionImports, dispatchSessionImport] = useReducer(
    sessionImportsReducer,
    [],
  );

  // PDF é nota de corretagem (BTG) e continua indo pro upload de nota.
  const DEFAULT_UPLOAD_PROVIDER = 'b3';

  // Os arquivos da B3 entram na carteira escolhida no formulário; com uma
  // carteira só, não faz sentido obrigar a escolha.
  const importPortfolioId =
    selectedPortfolioId ||
    (Array.isArray(portfolios) && portfolios.length === 1
      ? String(portfolios[0].id || portfolios[0]._id)
      : '');

  const {data: uploads = []} = useQuery<any[]>({
    queryKey: ['broker-uploads'],
    queryFn: async () => {
      try {
        const res = await brokerSyncService.getUploads();
        return res.data || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const recentImports = useMemo(
    () =>
      uploads
        .filter((u: any) => !sessionImports.some((imp) => imp.name === u.originalName))
        .slice(0, 8)
        .map((u: any) => {
        const status =
          u.status === 'processed'
            ? 'success'
            : u.status === 'failed'
            ? 'error'
            : 'pending';
        const statusLabel =
          u.status === 'processed'
            ? 'Concluído'
            : u.status === 'failed'
            ? 'Falhou'
            : u.status === 'processing'
            ? 'Processando'
            : u.status === 'queued'
            ? 'Na fila'
            : 'Recebido';
        return {
          id: String(u._id || u.id || `${u.originalName}-${u.createdAt}`),
          icon:
            status === 'success'
              ? 'ph-fill ph-check-circle'
              : status === 'error'
              ? 'ph-fill ph-x-circle'
              : 'ph-fill ph-spinner-gap',
          color:
            status === 'success'
              ? 'var(--pos)'
              : status === 'error'
              ? 'var(--neg)'
              : 'var(--warn)',
          label: u.originalName || 'Arquivo enviado',
          meta: [
            IMPORT_KIND_LABEL[u.kind || 'brokerage_note'] || u.kind,
            u.createdAt
              ? new Date(u.createdAt).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'})
              : null,
            status === 'error' ? u.errorMessage : null,
          ]
            .filter(Boolean)
            .join(' • '),
          status,
          statusLabel,
        };
      }),
    [uploads, sessionImports],
  );

  const dismissUpload = useMutation({
    mutationFn: (uploadId: string) => brokerSyncService.dismissUpload(uploadId),
    onSuccess: () =>
      queryClient.invalidateQueries({queryKey: ['broker-uploads']}),
    onError: () =>
      toast.error('Não foi possível remover', 'Tente novamente em instantes.'),
  });

  // Faz polling do status de processamento de um upload até virar
  // `processed` ou `failed` (ou até estourar o timeout), igual ao fluxo
  // já usado em SyncAccounts.tsx.
  const pollUploadStatus = useCallback(
    async (uploadId: string) => {
      const POLL_INTERVAL_MS = 2500;
      const TIMEOUT_MS = 60000;
      const startedAt = Date.now();

      while (Date.now() - startedAt < TIMEOUT_MS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

        try {
          const res = await brokerSyncService.getUploadStatus(uploadId);
          const status = res.data?.status;

          if (status === 'processed') {
            queryClient.invalidateQueries();
            const stats = res.data?.stats || {};
            toast.success('Nota processada!', `${stats.tradesImported ?? 0} operação(ões) importada(s) e ${stats.assetsUpdated ?? 0} ativo(s) atualizado(s).`);
            return;
          }

          if (status === 'failed') {
            queryClient.invalidateQueries({queryKey: ['broker-uploads']});
            toast.error('Falha ao processar nota', res.data?.errorMessage || 'Não foi possível processar o arquivo enviado.');
            return;
          }
          // received | queued | processing: continua o polling
        } catch {
          // falha pontual de rede ao consultar status: tenta de novo até o timeout
        }
      }

      queryClient.invalidateQueries({queryKey: ['broker-uploads']});
      toast.info(
        'Processamento demorado',
        'O processamento do arquivo está demorando mais que o esperado. Acompanhe o status na lista de importações.',
      );
    },
    [queryClient, toast],
  );

  const uploadBrokerageNotePdf = async (file: File) => {
    const res = await brokerSyncService.uploadNote(DEFAULT_UPLOAD_PROVIDER, file);
    queryClient.invalidateQueries({queryKey: ['broker-uploads']});
    const uploadId = res.data?.uploadId;
    if (uploadId) {
      void pollUploadStatus(String(uploadId));
    }
  };

  const importB3OrNote = async (file: File) => {
    try {
      return await PortfolioService.importB3Auto(importPortfolioId, file);
    } catch (error: any) {
      if (error?.response?.data?.code !== 'NOT_B3_PDF') throw error;
      await uploadBrokerageNotePdf(file);
      return null;
    }
  };

  const importFiles = async (files: File[]) => {
    if (!files.length) return;

    const b3Files = files.filter((file) => !isPdf(file));
    if (b3Files.length && !importPortfolioId) {
      toast.error('Escolha o portfólio', Array.isArray(portfolios) && portfolios.length === 0
            ? 'Crie uma carteira antes de importar os arquivos da B3.'
            : 'Selecione no formulário ao lado em qual portfólio os arquivos da B3 devem entrar.');
      return;
    }

    setIsUploading(true);
    let imported = 0;
    try {
      for (const file of sortB3Files(files)) {
        dispatchSessionImport({type: 'start', name: file.name});
        try {
          const result =
            importPortfolioId || !isPdf(file)
              ? await importB3OrNote(file)
              : await uploadBrokerageNotePdf(file).then(() => null);
          if (!result) {
            dispatchSessionImport({
              type: 'done',
              name: file.name,
              summary: 'Nota enviada — processando',
            });
          } else {
            dispatchSessionImport({
              type: 'done',
              name: file.name,
              summary: summarizeB3Import(result),
              warnings: result?.warnings,
            });
          }
          imported += 1;
        } catch (error: any) {
          dispatchSessionImport({
            type: 'fail',
            name: file.name,
            summary:
              error?.response?.data?.message ||
              'Não foi possível importar este arquivo.',
          });
        }
      }
    } finally {
      setIsUploading(false);
    }

    if (imported > 0) {
      queryClient.invalidateQueries();
      toast.success('Importação concluída', `${imported} de ${files.length} arquivo(s) importado(s). Veja o resultado em "Importações recentes".`);
    } else {
      queryClient.invalidateQueries({queryKey: ['broker-uploads']});
      toast.error('Nenhum arquivo importado', 'Veja o motivo de cada arquivo em "Importações recentes".');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    await importFiles(files);
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    await importFiles(Array.from(e.dataTransfer.files ?? []));
  };

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
        <section
          data-testid="b3-dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            if (!isDragging) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{position: 'relative', border: `1px dashed ${isDragging ? 'var(--color-accent)' : 'rgba(145,132,217,0.45)'}`, borderRadius: 8, overflow: 'hidden', background: 'linear-gradient(122deg, rgba(111,94,217,0.24) 0%, rgba(76,201,240,0.10) 58%, rgba(var(--rgb-surf-2),0.86) 100%), var(--surf-2)'}}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.csv,.xlsx,.xls"
            style={{display: 'none'}}
            onChange={handleFileChange}
            data-testid="b3-file-input"
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
              <button
                type="button"
                onClick={chooseFiles}
                disabled={isUploading}
                style={{height: 36, padding: '0 16.8px', borderRadius: 8, border: '1px solid var(--color-accent)', background: 'rgba(145,132,217,0.14)', color: 'var(--color-accent-100)', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 500, cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.7 : 1}}>
                {isUploading ? 'Enviando...' : 'Escolher arquivos'}
              </button>
              <button type="button" onClick={() => setGuideOpen(true)} style={{height: 36, padding: '0 16.8px', borderRadius: 8, border: '1px solid var(--hair)', background: 'transparent', color: 'var(--color-neutral-200)', fontFamily: 'var(--font-body)', fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5.6}}>
                <i className="ph-fill ph-question" style={{fontSize: 14}} /> Qual arquivo eu preciso?
              </button>
            </div>
          </div>
        </section>

        {/* Recent imports */}
        <section style={{border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'}}>
          <SectionHeader title="Importações recentes" />
          <div style={{padding: '5.6px 0'}}>
            {sessionImports.map((imp, index) => (
              <div key={`session-${imp.name}-${index}`} style={{display: 'flex', alignItems: 'center', gap: 11.2, padding: '9.8px 16.8px'}}>
                <i
                  className={imp.status === 'success' ? 'ph-fill ph-check-circle' : imp.status === 'error' ? 'ph-fill ph-x-circle' : 'ph-fill ph-spinner-gap'}
                  style={{fontSize: 16, color: imp.status === 'success' ? 'var(--pos)' : imp.status === 'error' ? 'var(--neg)' : 'var(--warn)'}}
                />
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontSize: 12.5, color: 'var(--color-neutral-200)'}}>{imp.name}</div>
                  <div style={{fontSize: 10.5, color: 'var(--color-neutral-600)', marginTop: 2}}>
                    {imp.status === 'pending' ? 'Importando…' : imp.summary}
                  </div>
                  {imp.warnings?.map((warning) => (
                    <div key={warning} style={{fontSize: 10.5, color: 'var(--warn)', marginTop: 2}}>{warning}</div>
                  ))}
                </div>
                <span style={IMPORT_STATUS_STYLE[imp.status]}>
                  {imp.status === 'success' ? 'Concluído' : imp.status === 'error' ? 'Falhou' : 'Importando'}
                </span>
              </div>
            ))}
            {sessionImports.length === 0 && recentImports.length === 0 ? (
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
                  {imp.status !== 'pending' ? (
                    <button
                      type="button"
                      aria-label={`Remover ${imp.label} das importações recentes`}
                      onClick={() => dismissUpload.mutate(imp.id)}
                      disabled={dismissUpload.isPending}
                      style={{border: 0, background: 'transparent', color: 'var(--color-neutral-600)', cursor: 'pointer', padding: 2, display: 'inline-flex'}}>
                      <i className="ph ph-x" style={{fontSize: 14}} />
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <B3ImportGuideModal
        open={guideOpen}
        onOpenChange={setGuideOpen}
        onImportReport={() => {
          setGuideOpen(false);
          chooseFiles();
        }}
        onGoToTransactions={() => {
          setGuideOpen(false);
          chooseFiles();
        }}
      />
    </div>
  );
}
