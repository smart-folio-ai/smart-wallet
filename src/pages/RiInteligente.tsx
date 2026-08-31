import {useMemo, useState, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {PremiumBlur} from '@/components/ui/premium-blur';
import {AiGeneratedNotice} from '@/components/ui/ai-generated-notice';
import {useSubscription} from '@/hooks/useSubscription';
import {
  RiAssetSuggestion,
  RiDocumentListItem,
  RiDocumentType,
} from '@/interface/ri-intelligence';
import {
  RiDocumentSummaryOutput,
  autocompleteRiAssets,
  searchRiDocuments,
  summarizeRiDocument,
} from '@/services/ri-intelligence';

const documentTypeOptions: Array<{
  label: string;
  value: RiDocumentType | 'all';
}> = [
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
  const {
    warnings,
    query,
    typeFilter,
    availableDocumentTypes,
    suggestedFilters,
  } = params;
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
      description:
        'Não foi possível identificar o ticker informado. Revise o código e tente novamente.',
      suggestedFilters: ['all'],
    };
  }

  if (warnings.includes('ri_documents_unavailable')) {
    return {
      title: 'Busca de RI indisponível no momento',
      description:
        'Não foi possível consultar os documentos agora. Tente novamente em instantes.',
      suggestedFilters: ['all'],
    };
  }

  if (warnings.includes('ri_no_recent_releases_found')) {
    return {
      title: 'Sem documentos recentes com os filtros atuais',
      description:
        'Encontramos histórico, mas não há documentos recentes válidos para a busca aplicada.',
      suggestedFilters: ['all'],
    };
  }

  // O backend encontrou documentos, mas nenhum passou na validação do link
  // (arquivo indisponível, redirecionado para uma página de erro, ou tipo
  // de conteúdo que não é PDF/planilha). Sem este caso, a busca caía na
  // mensagem genérica de rodapé — que lê como "não encontrou nada", quando
  // na verdade encontrou e descartou por o link não abrir de verdade.
  if (warnings.includes('ri_no_valid_documents_found')) {
    return {
      title: 'Documentos encontrados, mas os links não abriram',
      description: `Encontramos releases para ${query || 'o ticker informado'}, mas os links não passaram na validação (podem estar fora do ar ou redirecionando para uma página de erro). Tente novamente em instantes.`,
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

function buildDocumentDisplayTitle(document: RiDocumentListItem): string {
  const typeLabel = typeLabels[document.documentType] || 'Document';
  if (document.period) return `${typeLabel} · ${document.period}`;
  return typeLabel;
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
  const [selectedDocument, setSelectedDocument] =
    useState<RiDocumentListItem | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<RiDocumentSummaryOutput | null>(null);
  const [showSlowNotice, setShowSlowNotice] = useState(false);

  const {planName, isSubscribed} = useSubscription();
  const canUseAiSummary = isPremiumOrGlobal(planName, isSubscribed);

  const normalizedDraft = normalizeSearchQuery(queryDraft);
  const normalizedQuery = normalizeSearchQuery(query);
  const hasSearchQuery = normalizedQuery.length >= 2;

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
        query: normalizedQuery,
        documentType: typeFilter,
        limit: 30,
      }),
    enabled: hasSearchQuery,
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
    [
      warnings,
      query,
      typeFilter,
      fallback.availableDocumentTypes,
      fallback.suggestedFilters,
    ],
  );

  useEffect(() => {
    if (!isLoading) {
      setShowSlowNotice(false);
      return;
    }
    const timer = setTimeout(() => setShowSlowNotice(true), 15000);
    return () => clearTimeout(timer);
  }, [isLoading]);

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
    setSelectedDocument(null);
    setSummary(null);
  };

  const selectSuggestion = (suggestion: RiAssetSuggestion) => {
    const ticker = suggestion.ticker;
    applySearch(ticker);
    if (normalizeSearchQuery(query) === ticker) {
      void refetch();
    }
  };

  const clearSearch = () => {
    setQueryDraft('');
    setQuery('');
    setSummary(null);
    setSelectedDocument(null);
  };

  return (
    <div className="container py-8 space-y-6">
      <header
        className="rounded-2xl p-6"
        style={{
          border: '1px solid var(--hair)',
          background:
            'linear-gradient(120deg, rgba(111,94,217,0.10) 0%, rgba(76,201,240,0.06) 100%)',
        }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              RI Inteligente
            </h1>
            <p className="mt-2 text-sm" style={{color: 'var(--color-neutral-500)'}}>
              Busque releases recentes e relevantes com links validados antes da
              exibição.
            </p>
          </div>
          <Badge
            variant="outline"
            style={{border: '1px solid var(--hair)', color: 'var(--ac)'}}>
            Releases Recentes
          </Badge>
        </div>
      </header>

      <div
        style={{
          border: '1px solid var(--hair)',
          borderRadius: 8,
          background: 'var(--nk-card)',
        }}>
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--hair-soft)',
          }}>
          <div
            className="flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              fontWeight: 600,
            }}>
            <i
              className="ph-fill ph-file-magnifying-glass"
              style={{fontSize: 20, color: 'var(--ac)'}}
            />
            Busca de RI
          </div>
          <p
            style={{
              fontSize: 14,
              color: 'var(--color-neutral-500)',
              marginTop: 4,
            }}>
            Pesquise por ticker ou empresa com autocomplete e filtre por tipo de
            release.
          </p>
        </div>
        <div className="space-y-4" style={{padding: '14px 16px'}}>
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
                  <i className="ph-fill ph-magnifying-glass" style={{fontSize: 16}} />
                  Buscar
                </Button>
              </div>

              {normalizedDraft.length >= 2 &&
                suggestions.length > 0 &&
                normalizedDraft !== normalizedQuery && (
                  <div
                    className="rounded-xl p-2"
                    style={{
                      border: '1px solid var(--hair)',
                      background: 'var(--nk-card)',
                    }}
                    data-testid="ri-autocomplete-list">
                    {suggestions.slice(0, 6).map((item) => (
                      <button
                        key={`${item.ticker}-${item.company}`}
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm"
                        onClick={() => selectSuggestion(item)}>
                        <span className="font-semibold">{item.ticker}</span>
                        <span style={{color: 'var(--color-neutral-500)'}}>
                          {' '}
                          · {item.company}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as RiDocumentType | 'all')
              }>
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

            <Button
              variant="outline"
              onClick={() => refetch()}
              className="gap-2">
              <i className="ph-fill ph-arrows-clockwise" style={{fontSize: 16}} />
              Atualizar
            </Button>

            <Button
              variant="ghost"
              onClick={clearSearch}
              className="gap-2"
              data-testid="ri-clear-search">
              <i className="ph-fill ph-x-circle" style={{fontSize: 16}} />
              Limpar
            </Button>
          </div>

          {notice && (
            <div
              className="rounded-lg text-sm space-y-2 p-3"
              style={{
                border: '1px solid var(--warn)',
                background: 'rgba(154,106,6,0.10)',
                color: 'var(--warn)',
              }}
              data-testid="ri-notice">
              <p className="font-semibold">{notice.title}</p>
              <p>{notice.description}</p>
              {notice.suggestedFilters.some(
                (filter) => filter !== typeFilter,
              ) && (
                <div className="flex flex-wrap gap-2">
                  {notice.suggestedFilters
                    .filter((filter) => filter !== typeFilter)
                    .map((filter) => (
                      <Button
                        key={filter}
                        type="button"
                        variant="outline"
                        size="sm"
                        style={{
                          border: '1px solid var(--warn)',
                          background: 'rgba(154,106,6,0.10)',
                          color: 'var(--warn)',
                        }}
                        onClick={() => setTypeFilter(filter)}
                        data-testid={`ri-fallback-filter-${filter}`}>
                        Ver {filterLabels[filter]}
                      </Button>
                    ))}
                </div>
              )}
            </div>
          )}

          {!hasSearchQuery ? (
            <div
              className="rounded-xl text-sm p-6"
              style={{
                border: '1px dashed var(--hair)',
                color: 'var(--color-neutral-500)',
              }}>
              Type a ticker (e.g. PETR4) and click search.
            </div>
          ) : isLoading ? (
            <div
              className="flex flex-col items-center gap-3 rounded-xl text-sm p-6"
              style={{
                border: '1px dashed var(--hair)',
                color: 'var(--color-neutral-500)',
              }}>
              <i
                className="ph-fill ph-spinner animate-spin"
                style={{fontSize: 20}}
                data-testid="ri-loading-spinner"
              />
              <span>Carregando documentos...</span>
              {showSlowNotice && (
                <span className="text-xs" style={{color: 'var(--warn)'}}>
                  Isso pode levar até um minuto — estamos consultando múltiplas fontes oficiais.
                </span>
              )}
            </div>
          ) : documents.length === 0 ? (
            <div
              className="rounded-xl text-sm p-6"
              style={{
                border: '1px dashed var(--hair)',
                color: 'var(--color-neutral-500)',
              }}
              data-testid="ri-empty-state">
              {notice?.description ||
                'Nenhum release recente válido encontrado com os filtros atuais.'}
            </div>
          ) : (
            <div className="space-y-3" data-testid="ri-document-list">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-xl p-4 transition-colors"
                  style={{border: '1px solid var(--hair)'}}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        {document.ticker} · {document.company}
                      </p>
                      <p className="text-sm" style={{color: 'var(--color-neutral-500)'}}>
                        {buildDocumentDisplayTitle(document)}
                      </p>
                      <div
                        className="flex flex-wrap items-center gap-2 text-xs"
                        style={{color: 'var(--color-neutral-500)'}}>
                        <Badge variant="secondary">
                          {typeLabels[document.documentType] || 'Outros'}
                        </Badge>
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
                        variant={
                          selectedDocument?.id === document.id
                            ? 'secondary'
                            : 'default'
                        }
                        onClick={() => setSelectedDocument(document)}>
                        Selecionar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PremiumBlur
        locked={!canUseAiSummary}
        title="Resumo e comparação de release"
        description="Disponível para planos Premium e Global Investor">
        <div
          data-testid="ri-summary-panel"
          style={{
            border: '1px solid var(--hair)',
            borderRadius: 8,
            background: 'var(--nk-card)',
          }}>
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--hair-soft)',
            }}>
            <div
              className="flex items-center gap-2"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 14,
                fontWeight: 600,
              }}>
              <i
                className="ph-fill ph-sparkle"
                style={{fontSize: 20, color: 'var(--ac)'}}
              />
              Resumo automático do release
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--color-neutral-500)',
                marginTop: 4,
              }}>
              Gera highlights estruturados do documento selecionado com fallback
              seguro.
            </p>
          </div>
          <div className="space-y-4" style={{padding: '14px 16px'}}>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleGenerateSummary}
                disabled={!selectedDocument || summaryLoading}
                className="gap-2"
                data-testid="ri-generate-summary">
                <i className="ph-fill ph-file-text" style={{fontSize: 16}} />
                {summaryLoading ? 'Gerando resumo...' : 'Gerar resumo IA'}
              </Button>
              <span className="text-xs" style={{color: 'var(--color-neutral-500)'}}>
                {selectedDocument
                  ? `Documento selecionado: ${selectedDocument.ticker}`
                  : 'Selecione um documento para resumir'}
              </span>
            </div>

            {!summary ? (
              <div
                className="rounded-lg text-sm p-4"
                style={{
                  border: '1px dashed var(--hair)',
                  color: 'var(--color-neutral-500)',
                }}>
                Resumo ainda não gerado.
              </div>
            ) : (
              <div
                className="rounded-lg p-4 space-y-3"
                style={{border: '1px solid var(--hair)'}}
                data-testid="ri-summary-result">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">
                    Status: {summary.summary.status}
                  </Badge>
                  <Badge variant="outline">
                    Fonte: {summary.summary.sourceLabel}
                  </Badge>
                  <Badge variant="outline">
                    Cache hit: {summary.cache.hit ? 'sim' : 'não'}
                  </Badge>
                  <Badge variant="outline">
                    AI calls: {summary.cost.aiCalls}
                  </Badge>
                </div>

                {summary.summary.highlights.length > 0 ? (
                  <ul className="space-y-2">
                    {summary.summary.highlights.map((highlight, index) => (
                      <li
                        key={`${highlight}-${index}`}
                        className="text-sm rounded-md px-3 py-2"
                        style={{background: 'var(--surf-3)'}}>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm" style={{color: 'var(--color-neutral-500)'}}>
                    Sem highlights disponíveis no momento.
                  </p>
                )}

                {summary.summary.limitations.length > 0 && (
                  <div
                    className="rounded-md px-3 py-2 text-xs"
                    style={{
                      border: '1px solid var(--warn)',
                      background: 'rgba(154,106,6,0.10)',
                      color: 'var(--warn)',
                    }}>
                    Limitações: {summary.summary.limitations.join(', ')}
                  </div>
                )}

                {summary.summary.sourceLabel === 'ai_summary' && (
                  <AiGeneratedNotice />
                )}
              </div>
            )}

            <div
              className="rounded-lg text-xs p-4"
              style={{
                border: '1px dashed var(--hair)',
                color: 'var(--color-neutral-500)',
              }}
              data-testid="ri-release-comparison-placeholder">
              Comparação com release anterior será habilitada nesta área para
              planos Premium/Global.
            </div>
          </div>
        </div>
      </PremiumBlur>
    </div>
  );
};

export default RiInteligente;
