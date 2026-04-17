import {expect, test} from '@playwright/test';
import {mockAuthenticatedSession} from './helpers/mock-session';

test.describe('RI Inteligente', () => {
  test.beforeEach(async ({page}) => {
    await mockAuthenticatedSession(page, {planName: 'Premium'});
  });

  test('faz busca, seleciona documento e gera resumo IA', async ({page}) => {
    await page.route('**/ri-intelligence/autocomplete**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ticker: 'PETR4', company: 'Petrobras'}]),
      });
    });

    await page.route('**/ri-intelligence/documents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          documents: [
            {
              id: 'doc-1',
              ticker: 'PETR4',
              company: 'Petrobras',
              title: 'Release 1T26',
              documentType: 'earnings_release',
              period: '1T26',
              publishedAt: '2026-04-01T12:00:00.000Z',
              source: {
                type: 'url',
                value: 'https://ri.example.com/petr4-release.pdf',
              },
            },
          ],
          total: 1,
          warnings: [],
          fallback: {
            availableDocumentTypes: ['earnings_release'],
            suggestedFilters: ['all'],
          },
        }),
      });
    });

    await page.route('**/ri-intelligence/summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          document: {
            id: 'doc-1',
            ticker: 'PETR4',
            company: 'Petrobras',
            documentType: 'earnings_release',
            period: '1T26',
            publishedAt: '2026-04-01T12:00:00.000Z',
          },
          summary: {
            status: 'ai_generated',
            highlights: [
              'Receita cresceu 9% no trimestre.',
              'Alavancagem líquida caiu para 1,2x.',
            ],
            narrative: 'Resultado sólido com foco em desalavancagem.',
            limitations: [],
            sourceLabel: 'ai_summary',
          },
          structuredSignals: {},
          cache: {
            key: 'ri:doc-1',
            hit: false,
            ttlSeconds: 1800,
          },
          cost: {
            aiCalls: 1,
            tokenUsageEstimate: 820,
          },
        }),
      });
    });

    await page.goto('/ri-inteligente');

    await page.getByRole('textbox', {name: 'Busca de RI'}).fill('PE');
    await expect(page.getByTestId('ri-autocomplete-list')).toBeVisible();
    await page.getByTestId('ri-apply-search').click();

    await expect(page.getByTestId('ri-document-list')).toBeVisible();
    await expect(page.getByText(/PETR4 · Petrobras/i)).toBeVisible();

    await page.getByRole('button', {name: 'Selecionar'}).first().click();
    await page.getByTestId('ri-generate-summary').click();

    await expect(page.getByTestId('ri-summary-result')).toBeVisible();
    await expect(page.getByText(/Receita cresceu 9% no trimestre/i)).toBeVisible();
    await expect(page.getByText(/Status: ai_generated/i)).toBeVisible();
  });

  test('exibe estado de indisponibilidade quando busca de RI falha', async ({
    page,
  }) => {
    await page.route('**/ri-intelligence/autocomplete**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ticker: 'VALE3', company: 'Vale'}]),
      });
    });

    await page.route('**/ri-intelligence/documents**', async (route) => {
      await route.abort();
    });

    await page.goto('/ri-inteligente');
    await page.getByRole('textbox', {name: 'Busca de RI'}).fill('VA');
    await page.getByTestId('ri-apply-search').click();

    await expect(page.getByTestId('ri-notice')).toBeVisible();
    await expect(
      page.getByText('Busca de RI indisponível no momento'),
    ).toBeVisible();
    await expect(page.getByTestId('ri-empty-state')).toBeVisible();
  });
});
