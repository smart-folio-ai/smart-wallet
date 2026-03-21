import {expect, test} from '@playwright/test';

test.describe('Subscription Coming Soon', () => {
  test('exibe GlobalInvestor como em breve e bloqueado', async ({page}) => {
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'fake-token');
    });

    await page.route('**/subscription/current', async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.route('**/subscription', async (route) => {
      if (route.request().resourceType() === 'document') {
        await route.continue();
        return;
      }
      if (!route.request().url().includes('/subscription')) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 'free-1',
            name: 'Free',
            description: 'Plano gratuito',
            price: 0,
            currency: 'BRL',
            interval: 'month',
            intervalCount: 1,
            stripePriceId: 'price_free',
            stripeProductId: 'prod_free',
            isActive: true,
            features: ['Feature A'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: 'global-1',
            name: 'GlobalInvestor',
            description: 'Plano internacional',
            price: 199,
            currency: 'BRL',
            interval: 'month',
            intervalCount: 1,
            stripePriceId: 'price_global',
            stripeProductId: 'prod_global',
            isActive: true,
            features: ['Feature X', 'Feature Y'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      });
    });

    await page.goto('/subscription');

    const globalCard = page
      .locator('[class*="border"]')
      .filter({has: page.getByRole('heading', {name: 'GlobalInvestor'})})
      .first();

    await expect(globalCard).toBeVisible();
    await expect(globalCard.getByText('Em breve').first()).toBeVisible();
    await expect(globalCard.getByRole('button', {name: 'Em breve'})).toBeDisabled();
  });
});
