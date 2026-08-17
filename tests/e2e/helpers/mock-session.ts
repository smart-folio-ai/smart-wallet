import {Page} from '@playwright/test';
import {createFakeAccessToken} from './fake-jwt';

type SubscriptionPayload = {
  hasSubscription: boolean;
  status: string;
  plan: {
    _id: string;
    name: string;
    features: string[];
    price: number;
  };
};

export async function mockAuthenticatedSession(
  page: Page,
  options?: {
    planName?: 'Pro' | 'Premium' | 'Global Investor';
    features?: string[];
  },
) {
  const planName = options?.planName || 'Premium';
  const features = options?.features || ['ai_insights', 'comparator'];

  const accessToken = createFakeAccessToken();
  await page.addInitScript((token: string) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', 'e2e-refresh-token');
  }, accessToken);

  await page.route('**/subscription/current', async (route) => {
    const payload: SubscriptionPayload = {
      hasSubscription: true,
      status: 'active',
      plan: {
        _id: 'plan-e2e',
        name: planName,
        features,
        price: 29,
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}
