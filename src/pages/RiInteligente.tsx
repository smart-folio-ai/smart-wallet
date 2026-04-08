import {useMemo, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {FileSearch, FileText, RefreshCcw, Search, Sparkles, XCircle} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {useSubscription} from '@/hooks/useSubscription';
import {RiAssetSuggestion, RiDocumentListItem, RiDocumentType} from '@/interface/ri-intelligence';
import {
  RiDocumentSummaryOutput,
  autocompleteRiAssets,
  searchRiDocuments,
  summarizeRiDocument,
} from '@/services/ri-intelligence';

const documentTypeOptions: Array<{label: string; value: RiDocumentType | 'all'}> = [
  {label: 'Todos os releases recentes', value: 'all'},
  {label: 'Release de resultados', value: 'earnings_release'},
  {label: 'Apresentação de resultados', value: 'investor_presentation'},
  {label: 'Fato relevante', value: 'material_fact'},
  {label: 'Formulário de referência', value: 'reference_form'},
  {label: 'Aviso aos acionistas', value: 'shareholder_notice'},
  {label: 'Demonstrações financeiras', value: 'financial_statement'},
  {label: 'Relatório da administração', value: 'management_report'},
  {label: 'Material de conference call', value: 'conference_call_material'},
  {label: 'Aviso de dividendos/JCP', value: 'dividend_notice'},
  {label: 'Outros documentos de RI', value: 'other_ri_document'},
  {label: 'Tipo desconhecido', value: 'unknown'},
];

const typeLabels: Record<string, string> = {
  earnings_release: 'Release',
  investor_presentation: 'Apresentação',
  material_fact: 'Fato Relevante',
  reference_form: 'Form. Referência',
  shareholder_notice: 'Aviso Acionistas',
  financial_statement: 'Demonstrativos',
  management_report: 'Relatório Gestão',
  conference_call_material: 'Conference Call',
  dividend_notice: 'Dividendos/JCP',
  other_ri_document: 'Outros RI',
  unknown: 'Desconhecido',
};

const filterLabels: Record<RiDocumentType | 'all', string> = {
  all: 'Todos os releases recentes',
  earnings_release: 'Release de resultados',
  investor_presentation: 'Apresentação de resultados',
  material_fact: 'Fato relevante',
  reference_form: 'Formulário de referência',
  shareholder_notice: 'Aviso aos acionistas',
  financial_statement: 'Demonstrações financeiras',
  management_report: 'Relatório da administração',
  conference_call_material: 'Material de conference call',
  dividend_notice: 'Aviso de dividendos/JCP',
  other_ri_document: 'Outros documentos de RI',
  unknown: 'Tipo desconhecido',
};

type RiNoticeState = {
  title: string;
  description: string;
  suggestedFilters: Array<RiDocumentType | 'all'>;
};

function buildRiNotice(params: {
  warnings: string[];
  query: string;
  typeFilter: RiDocumentType | 'all';
  availableDocumentTypes: RiDocumentType[];
  suggestedFilters: Array<RiDocumentType | 'all'>;
}): RiNoticeState | null {
  const {warnings, query, typeFilter, availableDocumentTypes, suggestedFilters} = params;
  if (!warnings.length) return null;

  if (warnings.includes('ri_no_documents_for_selected_type')) {
    const availableTypesLabel = availableDocumentTypes
      .filter((type) => type !== typeFilter)
      .map((type) => filterLabels[type])
      .join(', ');
    return {
      title: 'Nenhum documento neste tipo de filtro',
      description: availableTypesLabel
        ? `Encontramos documentos de RI para ${query || 'o ticker informado'}, mas não em "${filterLabels[typeFilter]}". Tente ${availableTypesLabel} ou volte para "Todos os releases recentes".`
        : `Encontramos documentos de RI para ${query || 'o ticker informado'}, mas não em "${filterLabels[typeFilter]}". Tente "Todos os releases recentes".`,
      suggestedFilters,
    };
  }

  if (warnings.includes('ri_no_documents_found')) {
    return {
      title: 'Nenhum documento encontrado para este ticker',
      description: `Não encontramos documentos de RI para ${query || 'o ticker informado'} no período recente.`,
      suggestedFilters: ['all'],
    };
  }

  if (warnings.includes('ri_no_matching_assets')) {
    return {
      title: 'Ticker não encontrado',
      description: 'Não foi possível identificar o ticker informado. Revise o código e tente novamente.',
      suggestedFilters: ['all'],
    };
  }

  if (warnings.includes('ri_documents_unavailable')) {
    return {
      title: 'Busca de RI indisponível no momento',
      description: 'Não foi possível consultar os documentos agora. Tente novamente em instantes.',
      suggestedFilters: ['all'],
    };
  }

  if (warnings.includes('ri_no_recent_releases_found')) {
    return {
      title: 'Sem documentos recentes com os filtros atuais',
      description: 'Encontramos histórico, mas não há documentos recentes válidos para a busca aplicada.',
      suggestedFilters: ['all'],
    };
  }

  return null;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('pt-BR');
}

function isPremiumOrGlobal(planName: string, isSubscribed: boolean) {
  if (!isSubscribed) return false;
  const plan = String(planName || '').toLowerCase();
  return plan.includes('premium') || plan.includes('global');
}

function normalizeSearchQuery(value: string): string {
  return String(value || '').trim();
}

const RiInteligente = () => {
  const [queryDraft, setQueryDraft] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<RiDocumentType | 'all'>('all');
  const [selectedDocument, setSelectedDocument] = useState<RiDocumentListItem | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<RiDocumentSummaryOutput | null>(null);

  const {planName, isSubscribed} = useSubscription();
  const canUseAiSummary = isPremiumOrGlobal(planName, isSubscribed);

  const normalizedDraft = normalizeSearchQuery(queryDraft);

  const {data: suggestions = []} = useQuery({
    queryKey: ['ri-autocomplete', normalizedDraft],
    queryFn: () => autocompleteRiAssets(normalizedDraft, 8),
    enabled: normalizedDraft.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const {data, isLoading, refetch} = useQuery({
    queryKey: ['ri-documents', query, typeFilter],
    queryFn: () =>
      searchRiDocuments({
        query,
        documentType: typeFilter,
        limit: 30,
      }),
  });

  const documents = useMemo(() => data?.documents || [], [data?.documents]);
  const warnings = useMemo(() => data?.warnings || [], [data?.warnings]);
  const fallback = useMemo(
    () =>
      data?.fallback || {
        availableDocumentTypes: [],
        suggestedFilters: ['all' as const],
      },
    [data?.fallback],
  );
  const notice = useMemo(
    () =>
      buildRiNotice({
        warnings,
        query,
        typeFilter,
        availableDocumentTypes: fallback.availableDocumentTypes,
        suggestedFilters: fallback.suggestedFilters,
      }),
    [warnings, query, typeFilter, fallback.availableDocumentTypes, fallback.suggestedFilters],
  );

  const handleOpenDocument = (document: RiDocumentListItem) => {
    if (!document.source?.value) return;
    window.open(document.source.value, '_blank', 'noopener,noreferrer');
  };

  const handleGenerateSummary = async () => {
    if (!selectedDocument || !canUseAiSummary || summaryLoading) return;
    setSummaryLoading(true);
    try {
      const result = await summarizeRiDocument({
        document: selectedDocument,
      });
      setSummary(result);
    } finally {
      setSummaryLoading(false);
    }
  };

  const applySearch = (value?: string) => {
    const next = normalizeSearchQuery(value ?? queryDraft);
    setQueryDraft(next);
    setQuery(next);
  };

  const selectSuggestion = (suggestion: RiAssetSuggestion) => {
    const ticker = suggestion.ticker;
    setQueryDraft(ticker);
    if (query === ticker) {
      void refetch();
      return;
    }
    setQuery(ticker);
  };

  const clearSearch = () => {
    setQueryDraft('');
    setQuery('');
    setSummary(null);
    setSelectedDocument(null);
  };

  return (
    <div className="container py-8 space-y-6">
      <header className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-background p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">RI Inteligente</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Busque releases recentes e relevantes com links validados antes da exibição.
            </p>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            Releases Recentes
          </Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            Busca de RI
          </CardTitle>
          <CardDescription>
            Pesquise por ticker ou empresa com autocomplete e filtre por tipo de release.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_260px_auto_auto]">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={queryDraft}
                  onChange={(event) => setQueryDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      applySearch();
                    }
                  }}
                  placeholder="Ex: PETR4, BBDC4 ou Bradesco"
                  aria-label="Busca de RI"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applySearch()}
                  className="gap-2"
                  data-testid="ri-apply-search">
                  <Search className="h-4 w-4" />
                  Buscar
                </Button>
              </div>

              {normalizedDraft.length >= 2 && suggestions.length > 0 && (
                <div
                  className="rounded-xl border border-border/80 bg-card p-2"
                  data-testid="ri-autocomplete-list">
                  {suggestions.slice(0, 6).map((item) => (
                    <button
                      key={`${item.ticker}-${item.company}`}
                      type="button"
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/60"
                      onClick={() => selectSuggestion(item)}>
                      <span className="font-semibold">{item.ticker}</span>
                      <span className="text-muted-foreground"> · {item.company}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as RiDocumentType | 'all')}>
              <SelectTrigger aria-label="Filtro por tipo">
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {documentTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Atualizar
            </Button>

            <Button variant="ghost" onClick={clearSearch} className="gap-2" data-testid="ri-clear-search">
              <XCircle className="h-4 w-4" />
              Limpar
            </Button>
          </div>

          {notice && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200 space-y-2" data-testid="ri-notice">
              <p className="font-semibold">{notice.title}</p>
              <p>{notice.description}</p>
              {notice.suggestedFilters.some((filter) => filter !== typeFilter) && (
                <div className="flex flex-wrap gap-2">
                  {notice.suggestedFilters
                    .filter((filter) => filter !== typeFilter)
                    .map((filter) => (
                      <Button
                        key={filter}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-amber-400/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/20"
                        onClick={() => setTypeFilter(filter)}
                        data-testid={`ri-fallback-filter-${filter}`}>
                        Ver {filterLabels[filter]}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Carregando documentos...
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground" data-testid="ri-empty-state">
              {notice?.description || 'Nenhum release recente válido encontrado com os filtros atuais.'}
            </div>
          ) : (
            <div className="space-y-3" data-testid="ri-document-list">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-xl border border-border/80 p-4 hover:border-primary/40 transition-colors">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {document.ticker} · {document.company}
                      </p>
                      <p className="text-sm text-muted-foreground">{document.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">{typeLabels[document.documentType] || 'Outros'}</Badge>
                        <span>Data: {formatDate(document.publishedAt)}</span>
                        <span>Período: {document.period || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDocument(document)}>
                        Abrir PDF
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedDocument?.id === document.id ? 'secondary' : 'default'}
                        onClick={() => setSelectedDocument(document)}>
                        Selecionar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PremiumBlur
        locked={!canUseAiSummary}
        title="Resumo e comparação de release"
        description="Disponível para planos Premium e Global Investor">
        <Card data-testid="ri-summary-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Resumo automático do release
            </CardTitle>
            <CardDescription>
              Gera highlights estruturados do documento selecionado com fallback seguro.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleGenerateSummary}
                disabled={!selectedDocument || summaryLoading}
                className="gap-2"
                data-testid="ri-generate-summary">
                <FileText className="h-4 w-4" />
                {summaryLoading ? 'Gerando resumo...' : 'Gerar resumo IA'}
              </Button>
              <span className="text-xs text-muted-foreground">
                {selectedDocument
                  ? `Documento selecionado: ${selectedDocument.ticker}`
                  : 'Selecione um documento para resumir'}
              </span>
            </div>

            {!summary ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Resumo ainda não gerado.
              </div>
            ) : (
              <div className="rounded-lg border border-border/70 p-4 space-y-3" data-testid="ri-summary-result">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">Status: {summary.summary.status}</Badge>
                  <Badge variant="outline">Fonte: {summary.summary.sourceLabel}</Badge>
                  <Badge variant="outline">Cache hit: {summary.cache.hit ? 'sim' : 'não'}</Badge>
                  <Badge variant="outline">AI calls: {summary.cost.aiCalls}</Badge>
                </div>

                {summary.summary.highlights.length > 0 ? (
                  <ul className="space-y-2">
                    {summary.summary.highlights.map((highlight, index) => (
                      <li
                        key={`${highlight}-${index}`}
                        className="text-sm rounded-md bg-muted/40 px-3 py-2">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sem highlights disponíveis no momento.
                  </p>
                )}

                {summary.summary.limitations.length > 0 && (
                  <div className="rounded-md border border-amber-400/40 bg-amber-50/40 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                    Limitações: {summary.summary.limitations.join(', ')}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground" data-testid="ri-release-comparison-placeholder">
              Comparação com release anterior será habilitada nesta área para planos Premium/Global.
            </div>
          </CardContent>
        </Card>
      </PremiumBlur>
    </div>
  );
};

export default RiInteligente;
