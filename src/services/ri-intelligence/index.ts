import api from '@/server/api/api';
import {
  RiAssetSuggestion,
  RiDocumentListItem,
  SearchRiDocumentsInput,
  SearchRiDocumentsOutput,
} from '@/interface/ri-intelligence';

export interface RiDocumentSummaryOutput {
  document: {
    id: string;
    ticker: string;
    company: string;
    documentType: string;
    period: string | null;
    publishedAt: string;
  };
  summary: {
    status: 'ai_generated' | 'insufficient_content' | 'ai_failed' | 'cached_ai';
    highlights: string[];
    narrative: string | null;
    limitations: string[];
    sourceLabel: 'ai_summary' | 'structured_fallback';
  };
  structuredSignals: Record<string, unknown>;
  cache: {
    key: string | null;
    hit: boolean;
    ttlSeconds: number | null;
  };
  cost: {
    aiCalls: number;
    tokenUsageEstimate: number;
  };
}

type SummaryRequestInput = {
  document: RiDocumentListItem;
  forceRefresh?: boolean;
};

const summaryCache = new Map<string, {savedAt: number; data: RiDocumentSummaryOutput}>();
const SUMMARY_TTL_MS = 30 * 60 * 1000;

function getSummaryCacheKey(documentId: string) {
  return `ri-summary:${documentId}:v1`;
}

function readSummaryCache(documentId: string): RiDocumentSummaryOutput | null {
  const key = getSummaryCacheKey(documentId);
  const value = summaryCache.get(key);
  if (!value) return null;
  if (Date.now() - value.savedAt > SUMMARY_TTL_MS) {
    summaryCache.delete(key);
    return null;
  }
  return value.data;
}

function writeSummaryCache(documentId: string, data: RiDocumentSummaryOutput) {
  const key = getSummaryCacheKey(documentId);
  summaryCache.set(key, {
    savedAt: Date.now(),
    data,
  });
}

function normalizeDocuments(payload: any): RiDocumentListItem[] {
  const items = Array.isArray(payload) ? payload : payload?.documents || [];
  return items
    .map((item: any) => ({
      id: String(item?.id || item?._id || ''),
      ticker: String(item?.ticker || '').toUpperCase(),
      company: String(item?.company || item?.empresa || ''),
      title: String(item?.title || item?.titulo || ''),
      documentType: String(item?.documentType || 'other') as RiDocumentListItem['documentType'],
      period: item?.period ? String(item.period) : null,
      publishedAt: String(item?.publishedAt || item?.date || ''),
      source: {
        type: item?.source?.type === 'file' ? 'file' : 'url',
        value: String(item?.source?.value || item?.link || ''),
      },
    }))
    .filter((item: RiDocumentListItem) => item.id && item.ticker);
}

function normalizeAutocomplete(payload: any): RiAssetSuggestion[] {
  const items = Array.isArray(payload) ? payload : [];
  return items
    .map((item: any) => ({
      ticker: String(item?.ticker || item?.symbol || '').trim().toUpperCase(),
      company: String(item?.company || item?.name || '').trim(),
    }))
    .filter((item: RiAssetSuggestion) => item.ticker.length > 0 && item.company.length > 0);
}

export async function autocompleteRiAssets(
  query: string,
  limit = 8,
): Promise<RiAssetSuggestion[]> {
  const normalizedQuery = String(query || '').trim();
  if (!normalizedQuery) return [];

  try {
    const response = await api.get('/ri-intelligence/autocomplete', {
      params: {
        query: normalizedQuery,
        limit: Math.max(1, Math.min(limit, 20)),
      },
    });
    return normalizeAutocomplete(response.data);
  } catch {
    return [];
  }
}

export async function searchRiDocuments(
  input: SearchRiDocumentsInput,
): Promise<SearchRiDocumentsOutput> {
  try {
    const response = await api.get('/ri-intelligence/documents', {
      params: {
        query: input.query || undefined,
        documentType:
          input.documentType && input.documentType !== 'all'
            ? input.documentType
            : undefined,
        limit: input.limit || 50,
      },
    });
    const documents = normalizeDocuments(response.data);
    return {
      documents,
      total: Number(response.data?.total || documents.length),
      warnings: Array.isArray(response.data?.warnings) ? response.data.warnings : [],
    };
  } catch {
    return {
      documents: [],
      total: 0,
      warnings: ['ri_documents_unavailable'],
    };
  }
}

export async function summarizeRiDocument(
  input: SummaryRequestInput,
): Promise<RiDocumentSummaryOutput> {
  if (!input.forceRefresh) {
    const cached = readSummaryCache(input.document.id);
    if (cached) {
      return {
        ...cached,
        summary: {
          ...cached.summary,
          status: 'cached_ai',
        },
        cache: {
          ...cached.cache,
          hit: true,
        },
        cost: {
          aiCalls: 0,
          tokenUsageEstimate: 0,
        },
      };
    }
  }

  try {
    const response = await api.post('/ri-intelligence/summary', {
      document: input.document,
    });
    const normalized = response.data as RiDocumentSummaryOutput;
    writeSummaryCache(input.document.id, normalized);
    return normalized;
  } catch {
    return {
      document: {
        id: input.document.id,
        ticker: input.document.ticker,
        company: input.document.company,
        documentType: input.document.documentType,
        period: input.document.period,
        publishedAt: input.document.publishedAt,
      },
      summary: {
        status: 'ai_failed',
        highlights: [],
        narrative: null,
        limitations: ['ri_ai_summary_failed'],
        sourceLabel: 'structured_fallback',
      },
      structuredSignals: {},
      cache: {
        key: null,
        hit: false,
        ttlSeconds: null,
      },
      cost: {
        aiCalls: 1,
        tokenUsageEstimate: 0,
      },
    };
  }
}
