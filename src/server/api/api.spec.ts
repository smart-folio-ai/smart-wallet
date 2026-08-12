import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';

// Mock do localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Importar o apiClient após mocking localStorage
const {default: apiClient} = await import('./api');

describe('leadsService.capturePurchaseIntent', () => {
  let mock: InstanceType<typeof MockAdapter>;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    localStorageMock.clear();
  });

  afterEach(() => {
    mock.reset();
  });

  it('posts the email and plan id to /leads/purchase-intent', async () => {
    mock.onPost('/leads/purchase-intent').reply(200, {success: true});

    const {leadsService} = await import('./api');

    const response = await leadsService.capturePurchaseIntent(
      'investidor@example.com',
      'plan_premium',
    );

    expect(mock.history.post[0].url).toBe('/leads/purchase-intent');
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      email: 'investidor@example.com',
      planId: 'plan_premium',
    });
    expect(response.data).toEqual({success: true});
  });

  it('spreads attribution fields into the payload when provided', async () => {
    mock.onPost('/leads/purchase-intent').reply(200, {success: true});

    const {leadsService} = await import('./api');

    await leadsService.capturePurchaseIntent(
      'investidor@example.com',
      'plan_premium',
      {utmSource: 'reddit', utmCampaign: 'validacao'},
    );

    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      email: 'investidor@example.com',
      planId: 'plan_premium',
      utmSource: 'reddit',
      utmCampaign: 'validacao',
    });
  });
});
