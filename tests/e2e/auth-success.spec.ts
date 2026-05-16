import {expect, test} from '@playwright/test';

test.describe('Auth Success Flow', () => {
  test('realiza login com sucesso e entra no dashboard', async ({page}) => {
    await page.route('**/auth/signin', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'token-auth-success',
          refreshToken: 'refresh-auth-success',
        }),
      });
    });

    await page.route('**/subscription/current', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hasSubscription: true,
          status: 'active',
          plan: {
            _id: 'plan-pro',
            name: 'Pro',
            features: ['comparator', 'ai_insights'],
          },
        }),
      });
    });

    await page.goto('/signin');
    await page.locator('#signin-email').fill('pedro@trackerr.com');
    await page.locator('#signin-password').fill('senha123456');
    await page.locator('#signin-submit').click();

    await expect(page).toHaveURL(/\/dashboard$/, {timeout: 15_000});

    const storedToken = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );
    await expect(storedToken).toBe('token-auth-success');
  });
});
