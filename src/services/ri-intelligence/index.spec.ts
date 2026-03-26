import {beforeEach, describe, expect, it, vi} from 'vitest';

const {getMock, postMock} = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('@/server/api/api', () => ({
  default: {
    get: (...args: unknown[]) => getMock(...args),
    post: (...args: unknown[]) => postMock(...args),
  },
}));

import {autocompleteRiAssets, searchRiDocuments, summarizeRiDocument} from './index';

describe('ri-intelligence service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches and normalizes RI documents', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        warnings: ['ri_invalid_documents_filtered'],
        documents: [
          {
            id: 'doc-1',
            ticker: 'bbdc4',
            company: 'Bradesco',
            title: 'Release 4T25',
            documentType: 'earnings_release',
            period: '4T25',
            publishedAt: '2026-02-10T00:00:00.000Z',
            source: {type: 'url', value: 'https://example.com/doc.pdf'},
          },
        ],
      },
    });

    const output = await searchRiDocuments({query: 'BBDC4', documentType: 'all'});

    expect(output.documents).toHaveLength(1);
    expect(output.documents[0].ticker).toBe('BBDC4');
    expect(output.warnings).toEqual(['ri_invalid_documents_filtered']);
  });

  it('autocomplete supports ticker and company search', async () => {
    getMock.mockResolvedValueOnce({
      data: [
        {ticker: 'PETR4', company: 'Petrobras'},
        {ticker: 'BBDC4', company: 'Banco Bradesco S.A.'},
      ],
    });

    const output = await autocompleteRiAssets('brad', 5);

    expect(getMock).toHaveBeenCalledWith('/ri-intelligence/autocomplete', {
      params: {query: 'brad', limit: 5},
    });
    expect(output).toHaveLength(2);
    expect(output[1]).toEqual({
      ticker: 'BBDC4',
      company: 'Banco Bradesco S.A.',
    });
  });

  it('sends document type filter to releases endpoint', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        documents: [],
        total: 0,
        warnings: [],
      },
    });

    await searchRiDocuments({query: 'PETR4', documentType: 'material_fact'});

    expect(getMock).toHaveBeenCalledWith('/ri-intelligence/documents', {
      params: {
        query: 'PETR4',
        documentType: 'material_fact',
        limit: 50,
      },
    });
  });

  it('returns cached summary without new AI call', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        document: {
          id: 'doc-1',
          ticker: 'BBDC4',
          company: 'Bradesco',
          documentType: 'earnings_release',
          period: '4T25',
          publishedAt: '2026-02-10T00:00:00.000Z',
        },
        summary: {
          status: 'ai_generated',
          highlights: ['Receita cresceu'],
          narrative: null,
          limitations: [],
          sourceLabel: 'ai_summary',
        },
        structuredSignals: {},
        cache: {key: 'x', hit: false, ttlSeconds: 1800},
        cost: {aiCalls: 1, tokenUsageEstimate: 123},
      },
    });

    const document = {
      id: 'doc-1',
      ticker: 'BBDC4',
      company: 'Bradesco',
      title: 'Release',
      documentType: 'earnings_release' as const,
      period: '4T25',
      publishedAt: '2026-02-10T00:00:00.000Z',
      source: {type: 'url' as const, value: 'https://example.com/doc.pdf'},
    };

    const first = await summarizeRiDocument({document});
    const second = await summarizeRiDocument({document});

    expect(first.summary.status).toBe('ai_generated');
    expect(second.summary.status).toBe('cached_ai');
    expect(postMock).toHaveBeenCalledTimes(1);
  });

  it('falls back safely when AI summary request fails', async () => {
    postMock.mockRejectedValueOnce(new Error('ai down'));

    const output = await summarizeRiDocument({
      document: {
        id: 'doc-2',
        ticker: 'ITUB4',
        company: 'Itau',
        title: 'Release',
        documentType: 'earnings_release',
        period: '4T25',
        publishedAt: '2026-02-10T00:00:00.000Z',
        source: {type: 'url', value: 'https://example.com/doc.pdf'},
      },
    });

    expect(output.summary.status).toBe('ai_failed');
    expect(output.summary.limitations).toEqual(
      expect.arrayContaining(['ri_ai_summary_failed']),
    );
  });
});
