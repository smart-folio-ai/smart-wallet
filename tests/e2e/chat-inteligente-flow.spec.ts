import {expect, test} from '@playwright/test';
import {mockAuthenticatedSession} from './helpers/mock-session';

test.describe('Chat Inteligente', () => {
  test.beforeEach(async ({page}) => {
    await mockAuthenticatedSession(page, {planName: 'Premium'});
  });

  test('envia pergunta e renderiza resposta estruturada da carteira', async ({
    page,
  }) => {
    await page.route('**/ai/chat/intelligent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          intent: 'portfolio_summary',
          deterministic: true,
          message: 'Sua carteira está saudável e bem distribuída.',
          data: {
            portfolioSummary: {
              totalValue: 11940.42,
            },
            portfolioAssets: [
              {symbol: 'PETR4', allocationPct: 22.5},
              {symbol: 'ITUB4', allocationPct: 18.2},
            ],
            trackerrScore: {
              overall: 74,
              weights: {quality: 0.25, risk: 0.2, valuation: 0.2},
            },
          },
        }),
      });
    });

    await page.goto('/chat-inteligente');
    await page
      .getByRole('textbox', {name: 'Pergunta do chat'})
      .fill('quais ativos tem na minha carteira?');
    await page.getByRole('button', {name: 'Enviar'}).click();

    await expect(page.getByTestId('chat-message-user')).toBeVisible();
    await expect(page.getByTestId('chat-assistant-summary')).toBeVisible();
    await expect(page.getByTestId('chat-block-portfolio-summary')).toBeVisible();
    await expect(page.getByTestId('chat-block-portfolio-summary').getByText(/PETR4/i)).toBeVisible();
    await expect(page.getByText(/Trackerr Score/i)).toBeVisible();
  });

  test('mostra erro e permite retry quando backend falha', async ({page}) => {
    let attempt = 0;
    await page.route('**/ai/chat/intelligent', async (route) => {
      attempt += 1;
      if (attempt === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({message: 'temporary error'}),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          intent: 'portfolio_risk',
          deterministic: true,
          message: 'Risco calculado com sucesso.',
          data: {
            portfolioRisk: {
              risk: {score: 60},
              concentrationByAsset: [{symbol: 'PETR4', weightPct: 20}],
            },
          },
        }),
      });
    });

    await page.goto('/chat-inteligente');
    await page.getByRole('textbox', {name: 'Pergunta do chat'}).fill('Mostre o risco da minha carteira');
    await page.getByRole('button', {name: 'Enviar'}).click();

    await expect(
      page.getByText('Não consegui responder agora. Você pode tentar novamente.'),
    ).toBeVisible();

    await page.getByRole('button', {name: /Tentar novamente/i}).click();
    await expect(page.getByTestId('chat-block-risk')).toBeVisible();
    await expect(page.getByText('Score: 60')).toBeVisible();
  });

  test('comitê semanal exibe recomendações com motivo', async ({page}) => {
    await page.route('**/ai/chat/intelligent', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          intent: 'investment_committee',
          deterministic: true,
          message: 'Comitê semanal gerado.',
          data: {
            investmentCommittee: {
              modelVersion: 'v1',
              recommended: [
                {
                  symbol: 'PETR4',
                  reasons: ['Valuation descontado e fluxo de caixa resiliente'],
                },
              ],
              avoid: [
                {
                  symbol: 'MOVI3',
                  reasons: ['Alavancagem elevada para o cenário de juros'],
                },
              ],
              criticalRisks: ['Concentração elevada em ações locais'],
              objectivePlan: ['Reduzir risco setorial em 10%'],
            },
          },
        }),
      });
    });

    await page.goto('/chat-inteligente');
    await page.getByRole('button', {name: 'Gerar comitê semanal'}).click();

    await expect(page.getByTestId('chat-structured-details').getByText('Comitê de Investimento')).toBeVisible();
    await expect(
      page.getByText(/Motivos \(top recomendações\)/i),
    ).toBeVisible();
    await expect(
      page.getByText(/Valuation descontado e fluxo de caixa resiliente/i),
    ).toBeVisible();
    await expect(page.getByText(/Riscos críticos/i)).toBeVisible();
  });
});
