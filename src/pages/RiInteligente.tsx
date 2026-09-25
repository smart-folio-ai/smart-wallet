import {useEffect, useMemo, useReducer, useState, type CSSProperties} from 'react';
import {Link} from 'react-router-dom';
import {useMutation, useQuery} from '@tanstack/react-query';
import {AiGeneratedNotice} from '@/components/ui/ai-generated-notice';
import {useSubscription} from '@/hooks/useSubscription';
import {
  RiAssetSuggestion,
  RiDocumentListItem,
  RiDocumentType,
} from '@/interface/ri-intelligence';
import {
  autocompleteRiAssets,
  searchRiDocuments,
  summarizeRiDocument,
} from '@/services/ri-intelligence';

type TypeFilter = RiDocumentType | 'all';

const filterLabels: Record<TypeFilter, string> = {
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

type RiNoticeState = {
  title: string;
  description: string;
  suggestedFilters: TypeFilter[];
};

function buildRiNotice(params: {
  warnings: string[];
  query: string;
  typeFilter: TypeFilter;
  availableDocumentTypes: RiDocumentType[];
  suggestedFilters: TypeFilter[];
}): RiNoticeState | null {
  const {warnings, query, typeFilter, availableDocumentTypes, suggestedFilters} = params;
  if (!warnings.length) return null;
  const subject = query || 'o ticker informado';

  if (warnings.includes('ri_no_documents_for_selected_type')) {
    const availableTypesLabel = availableDocumentTypes
      .filter((type) => type !== typeFilter)
      .map((type) => filterLabels[type])
      .join(', ');
    return {
      title: 'Nenhum documento neste tipo de filtro',
      description: availableTypesLabel
        ? `Encontramos documentos de RI para ${subject}, mas não em "${filterLabels[typeFilter]}". Tente ${availableTypesLabel} ou volte para "Todos os releases recentes".`
        : `Encontramos documentos de RI para ${subject}, mas não em "${filterLabels[typeFilter]}". Tente "Todos os releases recentes".`,
      suggestedFilters,
    };
  }
  if (warnings.includes('ri_no_documents_found')) {
    return {
      title: 'Nenhum documento encontrado para este ticker',
      description: `Não encontramos documentos de RI para ${subject} no período recente.`,
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
  // O backend encontrou documentos, mas nenhum passou na validação do link:
  // sem este caso a tela diria "não encontrou nada" quando descartou links quebrados.
  if (warnings.includes('ri_no_valid_documents_found')) {
    return {
      title: 'Documentos encontrados, mas os links não abriram',
      description: `Encontramos releases para ${subject}, mas os links não passaram na validação (podem estar fora do ar ou redirecionando para uma página de erro). Tente novamente em instantes.`,
      suggestedFilters: ['all'],
    };
  }
  return null;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('pt-BR');
}

function buildDocumentDisplayTitle(document: RiDocumentListItem): string {
  const typeLabel = typeLabels[document.documentType] || 'Documento';
  return document.period ? `${typeLabel} · ${document.period}` : typeLabel;
}

interface SearchState {
  draft: string;
  query: string;
  typeFilter: TypeFilter;
  selected: RiDocumentListItem | null;
}

type SearchAction =
  | {type: 'draft'; value: string}
  | {type: 'apply'; value: string}
  | {type: 'filter'; value: TypeFilter}
  | {type: 'select'; document: RiDocumentListItem}
  | {type: 'clear'};

const initialSearch: SearchState = {draft: '', query: '', typeFilter: 'all', selected: null};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'draft':
      return {...state, draft: action.value};
    case 'apply':
      return {...state, draft: action.value, query: action.value, selected: null};
    case 'filter':
      return {...state, typeFilter: action.value};
    case 'select':
      return {...state, selected: action.document};
    case 'clear':
      return {...state, draft: '', query: '', selected: null};
  }
}

const fieldStyle: CSSProperties = {
  height: 38,
  borderRadius: 8,
  border: '1px solid var(--hair)',
  background: 'var(--sunk)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-body)',
};

const cardStyle: CSSProperties = {border: '1px solid var(--hair)', borderRadius: 8, background: 'var(--nk-card)'};

const cardHeadStyle: CSSProperties = {padding: '14px 16.8px', borderBottom: '1px solid var(--hair-soft)'};

const cardTitleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6.4,
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 600,
};

const dashedStyle: CSSProperties = {
  border: '1px dashed var(--hair)',
  borderRadius: 8,
  fontSize: 12.5,
  color: 'var(--color-neutral-500)',
};

const chipStyle: CSSProperties = {
  border: '1px solid var(--hair)',
  borderRadius: 6,
  padding: '2px 8px',
  fontSize: 10.5,
  color: 'var(--color-neutral-400)',
};

const RiInteligente = () => {
  const [search, dispatch] = useReducer(searchReducer, initialSearch);
  const [showSlowNotice, setShowSlowNotice] = useState(false);
  const {hasRiAiSummary: canUseAiSummary} = useSubscription();

  const draft = search.draft.trim();
  const query = search.query.trim();
  const hasSearchQuery = query.length >= 2;

  const {data: suggestions = []} = useQuery({
    queryKey: ['ri-autocomplete', draft],
    queryFn: () => autocompleteRiAssets(draft, 8),
    enabled: draft.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  const {data, isLoading, refetch} = useQuery({
    queryKey: ['ri-documents', query, search.typeFilter],
    queryFn: () => searchRiDocuments({query, documentType: search.typeFilter, limit: 30}),
    enabled: hasSearchQuery,
  });

  const summary = useMutation({
    mutationFn: (document: RiDocumentListItem) => summarizeRiDocument({document}),
  });

  const documents = data?.documents ?? [];
  const notice = useMemo(
    () =>
      buildRiNotice({
        warnings: data?.warnings ?? [],
        query,
        typeFilter: search.typeFilter,
        availableDocumentTypes: data?.fallback?.availableDocumentTypes ?? [],
        suggestedFilters: data?.fallback?.suggestedFilters ?? ['all'],
      }),
    [data, query, search.typeFilter],
  );

  // A busca consulta várias fontes oficiais e pode demorar: depois de 15s
  // avisamos que ainda está trabalhando.
  useEffect(() => {
    if (!isLoading) {
      setShowSlowNotice(false);
      return;
    }
    const timer = setTimeout(() => setShowSlowNotice(true), 15000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const applySearch = (value = search.draft) => {
    const next = value.trim();
    // Mesma busca de novo: a query key não muda, então refaz explicitamente.
    if (next === query) void refetch();
    dispatch({type: 'apply', value: next});
    summary.reset();
  };

  const selectSuggestion = (suggestion: RiAssetSuggestion) => applySearch(suggestion.ticker);

  const openDocument = (document: RiDocumentListItem) => {
    if (!document.source?.value) return;
    window.open(document.source.value, '_blank', 'noopener,noreferrer');
  };

  const generateSummary = () => {
    if (!search.selected || !canUseAiSummary || summary.isPending) return;
    summary.mutate(search.selected);
  };

  const showSuggestions = draft.length >= 2 && suggestions.length > 0 && draft !== query;
  const result = summary.data;
  const generateDisabled = !search.selected || summary.isPending;

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 16.8}}>
      <div
        style={{
          borderRadius: 8,
          padding: 22.4,
          border: '1px solid var(--hair)',
          background: 'linear-gradient(120deg, rgba(152,160,171,0.16) 0%, rgba(76,201,240,0.08) 100%)',
        }}>
        <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16.8}}>
          <div>
            <h1 style={{fontFamily: 'var(--font-heading)', fontSize: 21, fontWeight: 600, letterSpacing: '-0.015em', margin: 0}}>
              RI Inteligente
            </h1>
            <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)', marginTop: 5.6}}>
              Busque releases recentes e relevantes com links validados antes da exibição.
            </div>
          </div>
          <span
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              height: 24,
              padding: '0 9.8px',
              borderRadius: 6,
              border: '1px solid var(--hair)',
              fontSize: 11,
              color: 'var(--ac)',
            }}>
            Releases recentes
          </span>
        </div>
      </div>

      <section style={cardStyle}>
        <div style={cardHeadStyle}>
          <h2 style={{...cardTitleStyle, margin: 0}}>
            <i className="ph-fill ph-file-magnifying-glass" style={{fontSize: 17, color: 'var(--ac)'}} aria-hidden />
            <span>Busca de RI</span>
          </h2>
          <div style={{fontSize: 12, color: 'var(--color-neutral-500)', marginTop: 3}}>
            Pesquise por ticker ou empresa, com autocomplete, e filtre por tipo de documento.
          </div>
        </div>
        <div style={{padding: '14px 16.8px', display: 'flex', flexDirection: 'column', gap: 11.2}}>
          <div className="grid grid-cols-1 gap-[8.4px] md:grid-cols-[minmax(0,1fr)_240px_auto_auto]">
            <div style={{position: 'relative'}}>
              <input
                type="text"
                value={search.draft}
                onChange={(event) => dispatch({type: 'draft', value: event.target.value})}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    applySearch();
                  }
                }}
                placeholder="Ex: PETR4, BBDC4 ou Bradesco"
                aria-label="Busca de RI"
                style={{...fieldStyle, width: '100%', fontSize: 13, padding: '0 11.2px'}}
              />
              {showSuggestions && (
                <div
                  data-testid="ri-autocomplete-list"
                  style={{
                    position: 'absolute',
                    zIndex: 10,
                    top: 42,
                    left: 0,
                    right: 0,
                    border: '1px solid var(--hair)',
                    borderRadius: 8,
                    background: 'var(--surf-4)',
                    boxShadow: 'var(--shadow-md)',
                    overflow: 'hidden',
                  }}>
                  {suggestions.slice(0, 6).map((item) => (
                    <button
                      key={`${item.ticker}-${item.company}`}
                      type="button"
                      onClick={() => selectSuggestion(item)}
                      className="hover:bg-[rgba(152,160,171,0.08)]"
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '8.4px 11.2px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        fontSize: 12.5,
                        color: 'var(--color-neutral-200)',
                      }}>
                      <b>{item.ticker}</b> <span style={{color: 'var(--color-neutral-500)'}}>· {item.company}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <select
              aria-label="Filtro por tipo"
              value={search.typeFilter}
              onChange={(event) => dispatch({type: 'filter', value: event.target.value as TypeFilter})}
              style={{...fieldStyle, fontSize: 12.5, padding: '0 8.4px'}}>
              {(Object.keys(filterLabels) as TypeFilter[]).map((value) => (
                <option key={value} value={value}>
                  {filterLabels[value]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => applySearch()}
              data-testid="ri-apply-search"
              style={{
                height: 38,
                padding: '0 14px',
                borderRadius: 8,
                border: '1px solid var(--color-accent)',
                background: 'rgba(152,160,171,0.14)',
                color: 'var(--color-accent-100)',
                fontFamily: 'var(--font-body)',
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}>
              <i className="ph ph-magnifying-glass" style={{fontSize: 14}} aria-hidden />
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch({type: 'clear'});
                summary.reset();
              }}
              data-testid="ri-clear-search"
              className="text-[color:var(--color-neutral-400)] hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)]"
              style={{
                height: 38,
                padding: '0 12px',
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'var(--hair)',
                background: 'transparent',
                fontFamily: 'var(--font-body)',
                fontSize: 12.5,
                cursor: 'pointer',
              }}>
              Limpar
            </button>
          </div>

          {notice && (
            <div
              data-testid="ri-notice"
              style={{
                border: '1px solid var(--warn)',
                borderRadius: 8,
                background: 'rgba(240,179,46,0.10)',
                padding: '11.2px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
              <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--warn)'}}>{notice.title}</div>
              <div style={{fontSize: 12, color: 'var(--color-neutral-300)', lineHeight: 1.5}}>{notice.description}</div>
              <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
                {notice.suggestedFilters
                  .filter((filter) => filter !== search.typeFilter)
                  .map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => dispatch({type: 'filter', value: filter})}
                      data-testid={`ri-fallback-filter-${filter}`}
                      style={{
                        height: 28,
                        padding: '0 11.2px',
                        borderRadius: 6,
                        border: '1px solid var(--warn)',
                        background: 'transparent',
                        color: 'var(--warn)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 11.5,
                        cursor: 'pointer',
                      }}>
                      Ver {filter === 'all' ? 'todos os releases recentes' : filterLabels[filter]}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {!hasSearchQuery ? (
            <div style={{...dashedStyle, padding: 22.4, textAlign: 'center'}}>
              Digite um ticker (ex: PETR4) e clique em buscar.
            </div>
          ) : isLoading ? (
            <div style={{...dashedStyle, padding: 22.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8.4}}>
              <i className="ph ph-circle-notch animate-spin" style={{fontSize: 20}} data-testid="ri-loading-spinner" aria-hidden />
              <span>Carregando documentos…</span>
              {showSlowNotice && (
                <span style={{fontSize: 11.5, color: 'var(--warn)'}}>
                  Isso pode levar até um minuto — estamos consultando múltiplas fontes oficiais.
                </span>
              )}
            </div>
          ) : documents.length === 0 ? (
            <div style={{...dashedStyle, padding: 22.4, textAlign: 'center'}} data-testid="ri-empty-state">
              {notice?.description || 'Nenhum release recente válido encontrado com os filtros atuais.'}
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: 8.4}} data-testid="ri-document-list">
              {documents.map((document) => {
                const selected = search.selected?.id === document.id;
                return (
                  <div
                    key={document.id}
                    className="flex flex-col gap-[11.2px] md:flex-row md:items-start md:justify-between md:gap-[16.8px]"
                    style={{
                      border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--hair)'}`,
                      borderRadius: 8,
                      padding: '14px 16.8px',
                      background: selected ? 'rgba(152,160,171,0.08)' : 'transparent',
                    }}>
                    <div style={{minWidth: 0}}>
                      <div style={{fontSize: 13, fontWeight: 600}}>
                        {document.ticker} · {document.company}
                      </div>
                      <div style={{fontSize: 12, color: 'var(--color-neutral-400)', marginTop: 2}}>
                        {buildDocumentDisplayTitle(document)}
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: 8.4, fontSize: 11, color: 'var(--color-neutral-600)', marginTop: 5.6, flexWrap: 'wrap'}}>
                        <span style={{border: '1px solid var(--hair)', borderRadius: 4, padding: '1px 6px'}}>
                          {typeLabels[document.documentType] || 'Outros'}
                        </span>
                        <span>Data: {formatDate(document.publishedAt)}</span>
                        <span>Período: {document.period || 'N/A'}</span>
                      </div>
                    </div>
                    <div style={{display: 'flex', gap: 8.4, flexShrink: 0}}>
                      <button
                        type="button"
                        onClick={() => openDocument(document)}
                        className="text-[color:var(--color-neutral-200)] hover:border-[color:var(--color-accent-700)] hover:text-[color:var(--color-neutral-100)]"
                        style={{height: 30, padding: '0 11.2px', borderRadius: 6, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--hair)', background: 'transparent', fontSize: 11.5, cursor: 'pointer'}}>
                        Abrir PDF
                      </button>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => dispatch({type: 'select', document})}
                        style={{
                          height: 30,
                          padding: '0 11.2px',
                          borderRadius: 6,
                          border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--hair)'}`,
                          background: selected ? 'rgba(152,160,171,0.16)' : 'transparent',
                          color: selected ? 'var(--color-accent-100)' : 'var(--color-neutral-300)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 11.5,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}>
                        {selected ? 'Selecionado' : 'Selecionar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section data-testid="ri-summary-panel" style={{...cardStyle, position: 'relative', overflow: 'hidden'}}>
        <div style={cardHeadStyle}>
          <h2 style={{...cardTitleStyle, margin: 0}}>
            <i className="ph-fill ph-sparkle" style={{fontSize: 17, color: 'var(--ac)'}} aria-hidden />
            <span>Resumo automático do release</span>
          </h2>
          <div style={{fontSize: 12, color: 'var(--color-neutral-500)', marginTop: 3}}>
            Gera highlights estruturados do documento selecionado, com fonte e nível de confiança.
          </div>
        </div>

        <div
          aria-hidden={!canUseAiSummary}
          style={{
            padding: '14px 16.8px',
            display: 'flex',
            flexDirection: 'column',
            gap: 11.2,
            ...(canUseAiSummary ? {} : {filter: 'blur(3px)', pointerEvents: 'none', userSelect: 'none'}),
          }}>
          <div style={{display: 'flex', alignItems: 'center', gap: 11.2, flexWrap: 'wrap'}}>
            <button
              type="button"
              onClick={generateSummary}
              disabled={generateDisabled}
              data-testid="ri-generate-summary"
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 8,
                border: 'none',
                cursor: generateDisabled ? 'not-allowed' : 'pointer',
                opacity: generateDisabled ? 0.5 : 1,
                background: 'var(--grad-violet)',
                color: 'var(--sunk)',
                fontFamily: 'var(--font-body)',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
              <i className="ph-fill ph-file-text" style={{fontSize: 14}} aria-hidden />
              {summary.isPending ? 'Gerando resumo…' : 'Gerar resumo IA'}
            </button>
            <span style={{fontSize: 11.5, color: 'var(--color-neutral-500)'}}>
              {search.selected ? `Documento selecionado: ${search.selected.ticker}` : 'Selecione um documento para resumir'}
            </span>
          </div>

          {summary.isError && (
            <div style={{border: '1px solid var(--neg)', borderRadius: 8, padding: '11.2px 14px', fontSize: 12, color: 'var(--neg)'}}>
              Não foi possível gerar o resumo agora. Tente novamente em instantes.
            </div>
          )}

          {result ? (
            <div
              data-testid="ri-summary-result"
              style={{border: '1px solid var(--hair)', borderRadius: 8, padding: '14px 16.8px', display: 'flex', flexDirection: 'column', gap: 11.2}}>
              <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
                <span style={chipStyle}>Status: {result.summary.status}</span>
                <span style={chipStyle}>Fonte: {result.summary.sourceLabel}</span>
                <span style={chipStyle}>Cache hit: {result.cache.hit ? 'sim' : 'não'}</span>
                <span style={chipStyle}>AI calls: {result.cost.aiCalls}</span>
              </div>
              {result.summary.highlights.length > 0 ? (
                <ul style={{margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6.4}}>
                  {result.summary.highlights.map((highlight, index) => (
                    <li
                      key={`${highlight}-${index}`}
                      style={{listStyle: 'none', fontSize: 12.5, lineHeight: 1.5, background: 'var(--surf-3)', borderRadius: 6, padding: '8.4px 11.2px'}}>
                      {highlight}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{fontSize: 12.5, color: 'var(--color-neutral-500)'}}>Sem highlights disponíveis no momento.</div>
              )}
              {result.summary.limitations.length > 0 && (
                <div style={{border: '1px solid var(--warn)', borderRadius: 6, background: 'rgba(240,179,46,0.10)', padding: '6.4px 11.2px', fontSize: 11, color: 'var(--warn)'}}>
                  Limitações: {result.summary.limitations.join(', ')}
                </div>
              )}
              {result.summary.sourceLabel === 'ai_summary' && <AiGeneratedNotice />}
            </div>
          ) : (
            <div style={{...dashedStyle, padding: 16.8}}>Resumo ainda não gerado.</div>
          )}

          <div data-testid="ri-release-comparison-placeholder" style={{...dashedStyle, padding: '14px 16.8px', fontSize: 11, color: 'var(--color-neutral-600)'}}>
            Comparação com release anterior será habilitada nesta área para planos Premium/Global.
          </div>
        </div>

        {!canUseAiSummary && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              top: 61,
              backdropFilter: 'blur(4px)',
              background: 'rgba(var(--rgb-bg),0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8.4,
              textAlign: 'center',
              padding: 22.4,
            }}>
            <i className="ph-fill ph-lock-simple" style={{fontSize: 22, color: 'var(--color-accent-300)'}} aria-hidden />
            <div style={{fontSize: 13.5, fontWeight: 600}}>Resumo e comparação de release</div>
            <div style={{fontSize: 12, color: 'var(--color-neutral-500)', maxWidth: 320}}>
              Disponível para planos Premium e Global Investor.
            </div>
            <Link
              to="/plans"
              style={{
                marginTop: 4,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 14px',
                borderRadius: 8,
                border: '1px solid var(--color-accent)',
                background: 'rgba(152,160,171,0.14)',
                color: 'var(--color-accent-100)',
                fontSize: 12,
                fontWeight: 500,
                textDecoration: 'none',
              }}>
              Fazer upgrade
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default RiInteligente;
