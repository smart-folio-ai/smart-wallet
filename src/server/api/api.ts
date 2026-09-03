import {ICreateUser} from '@/interface/authentication';
import {
  ICreateSubscription,
  IUpdateSubscriptionFeature,
} from '@/interface/subscription';
import {
  AdminPlanPayload,
  AdminPlanUpdatePayload,
  ListManualGrantsQuery,
  ManualGrantPayload,
  UpdateUserRolePayload,
} from '@/interface/admin';

import {apiUrlDevelopment, apiUrlProduction, isDev} from '@/utils/env';
import axios, {AxiosPromise} from 'axios';

const apiClient = axios.create({
  baseURL: isDev ? apiUrlDevelopment : apiUrlProduction,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Serviços de API
export const authService = {
  login: (email: string, password: string, keepConnected: boolean) =>
    apiClient.post('/auth/signin', {email, password, keepConnected}),
  googleSignin: (idToken: string, keepConnected: boolean) =>
    apiClient.post('/auth/google/signin', {idToken, keepConnected}),
  register: (data: ICreateUser) => apiClient.post('/users/create', data),
  logout: (token: string) => apiClient.post('/auth/signout', {token}),
  changePassword: (data: any) => apiClient.post('/auth/change-password', data),
};

export const profileService = {
  getProfile: (userId: string) => apiClient.get(`profile/${userId}`),
  getMyProfile: () => apiClient.get('profile/me'),
  getUser: (userId: string) => apiClient.get(`users/${userId}`),
  updateUser: (userId: string, data: any) =>
    apiClient.patch(`/users/update/${userId}`, data),
  updateProfile: (profileId: string, data: any) =>
    apiClient.patch(`/profile/${profileId}`, data),
  createProfile: (userId: string, data: any) =>
    apiClient.post(`/profile/create/${userId}`, data),
  getAllAddress: () => apiClient.get(`addresses/addresses`),
  getAddressUser: (userId: string) => apiClient.get(`addresses/user/${userId}`),
};

export const aiService = {
  analyze: (payload: any) => apiClient.post('/ai/analyze', payload),
  chat: (payload: any) => apiClient.post('/ai/chat', payload),
  intelligentChat: (payload: any) => apiClient.post('/ai/chat/intelligent', payload),
  trackerrScore: (payload: any) => apiClient.post('/ai/trackerr-score', payload),
  portfolioScore: () => apiClient.get('/ai/portfolio-score'),
  assetOpinion: (symbol: string) =>
    apiClient.post('/ai/asset-opinion', {symbol}),
  errorRadar: () => apiClient.get('/ai/error-radar'),
  futureSimulator: (payload: {
    horizon: '6m' | '1y' | '5y' | '10y';
    monthlyContribution?: number;
  }) => apiClient.post('/ai/future-simulator', payload),
  getInvestorProfile: () => apiClient.get('/ai/investor-profile'),
  updateInvestorProfile: (payload: {
    sophistication?: 'beginner' | 'intermediate' | 'experienced' | null;
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive' | null;
  }) => apiClient.put('/ai/investor-profile', payload),
  getChatHistory: () => apiClient.get('/ai/chat/history'),
  appendChatHistoryMessage: (payload: any) =>
    apiClient.post('/ai/chat/history', payload),
};

export const stockServices = {
  getGlobalStock: (query: string) =>
    apiClient.get(`/stocks/global/quote?symbol=${query}`),
  getCdiRate: () => apiClient.get('/stocks/macro/cdi'),
  getCdiSeries: (from: string, to: string) =>
    apiClient.get(`/stocks/macro/cdi/series?from=${from}&to=${to}`),
  getAllNationalStocks: (search = '') =>
    apiClient.get(`/stocks/all/national${search ? `?search=${encodeURIComponent(search)}&limit=30` : '?limit=100'}`),
  getNationalStock: (
    symbol: string,
    options?: {
      fundamental?: boolean;
      dividends?: boolean;
      range?: string;
      interval?: string;
    },
  ) => {
    const params = new URLSearchParams();
    if (options?.fundamental) params.append('fundamental', 'true');
    if (options?.dividends) params.append('dividends', 'true');
    if (options?.range) params.append('range', options.range);
    if (options?.interval) params.append('interval', options.interval);
    const query = params.toString();
    return apiClient.get(`/stocks/national/quote?symbol=${symbol}${query ? `&${query}` : ''}`);
  },
};

export const portfolioService = {
  getSummary: () => apiClient.get('/portfolio/summary'),
  getAssets: () => apiClient.get('/portfolio/assets'),
  getAssetDetails: (assetId: string) =>
    apiClient.get(`/portfolio/assets/${assetId}`),
  getTransactions: (params?: Record<string, unknown>) =>
    apiClient.get('/portfolio/transactions', {params}),
};

// export const connectionsService = {
//   getBrokerages: () => apiClient.get('/connections/brokerages'),
//   getCryptoExchanges: () => apiClient.get('/connections/crypto-exchanges'),
//   connectAccount: (type: string, credentials: Record<string, unknown>) =>
//     apiClient.post(`/connections/${type}`, credentials),
//   getConnections: () => apiClient.get('/connections'),
//   removeConnection: (id: string) => apiClient.delete(`/connections/${id}`),
//   syncConnection: (id: string) => apiClient.post(`/connections/${id}/sync`),
// };

// export const aiService = {
//   getInsights: () => apiClient.get('/ai/insights'),
//   getAssetAnalysis: (assetId: string) =>
//     apiClient.get(`/ai/asset-analysis/${assetId}`),
//   getMarketOverview: () => apiClient.get('/ai/market-overview'),
// };

// export const settingsService = {
//   getSettings: () => apiClient.get('/settings'),
//   updateSettings: (settings: Record<string, unknown>) =>
//     apiClient.put('/settings', settings),
// };

export const subscriptionService = {
  getPlans: () => apiClient.get('/subscription'),
  getById: (id: string) => apiClient.get(`/subscription/${id}`),
  getCurrentPlan: () => apiClient.get('/subscription/current'),
  createPlan: (data: ICreateSubscription) =>
    apiClient.post('/subscription/create', data),
  upgradePlan: (planId: string) =>
    apiClient.post('/subscription/upgrade', {planId}),
  updateFeaturePlan: (planId: string, data: IUpdateSubscriptionFeature) =>
    apiClient.post(`/subscription/${planId}/features`, {planId, data}),
  createCheckoutSession: (
    planId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string,
    billingInterval: 'monthly' | 'annual' = 'monthly',
  ) =>
    apiClient.post(`/subscription/${planId}/checkout`, {
      userId,
      successUrl,
      cancelUrl,
      billingInterval,
    }),
  cancelSubscription: (userId: string) =>
    apiClient.post('/subscription/cancel', {userId}),
  deleteSubscription: (userId: string) =>
    apiClient.post(`/subscription/delete/${userId}`, {userId}),
  createPortalSession: async (userId: string, returnUrl: string) => {
    const token = localStorage.getItem('access_token');
    return apiClient.post<{url: string}>(
      '/subscription/portal',
      {userId, returnUrl},
      {headers: {Authorization: `Bearer ${token}`}},
    );
  },
};

export const adminService = {
  getOverview: () => apiClient.get('/admin/overview'),
  getPlans: () => apiClient.get('/admin/plans'),
  createPlan: (data: AdminPlanPayload) => apiClient.post('/admin/plans', data),
  updatePlan: (planId: string, data: AdminPlanUpdatePayload) =>
    apiClient.patch(`/admin/plans/${planId}`, data),
  deactivatePlan: (planId: string) => apiClient.delete(`/admin/plans/${planId}`),
  grantSubscription: (data: ManualGrantPayload) =>
    apiClient.post('/admin/grants', data),
  listGrants: (params?: ListManualGrantsQuery) =>
    apiClient.get('/admin/grants', {params}),
  updateUserRoleByEmail: (data: UpdateUserRolePayload) =>
    apiClient.post('/admin/users/role', data),
  getWebhookStatus: () => apiClient.get('/admin/webhook/status'),
  getWebhookEvents: (limit?: number) =>
    apiClient.get('/admin/webhook/events', {params: limit ? {limit} : undefined}),
};

export const twoFactorService = {
  setup: () => apiClient.post('/auth/2fa/setup'),
  verify: (code: string) => apiClient.post('/auth/2fa/verify', {code}),
  disable: (code: string) =>
    apiClient.delete('/auth/2fa/disable', {data: {code}}),
  authenticate: (tempToken: string, code: string) =>
    apiClient.post('/auth/2fa/authenticate', {tempToken, code}),
};

export const brokerSyncService = {
  getConnections: () => apiClient.get('/broker-sync/connections'),
  connect: (data: {
    provider: string;
    apiKey?: string;
    apiSecret?: string;
    cpf?: string;
  }) => apiClient.post('/broker-sync/connect', data),
  sync: (provider: string) => apiClient.post(`/broker-sync/sync/${provider}`),
  disconnect: (provider: string) =>
    apiClient.delete(`/broker-sync/disconnect/${provider}`),
  getUploads: () => apiClient.get('/broker-sync/uploads'),
  getUploadStatus: (uploadId: string) =>
    apiClient.get(`/broker-sync/upload-note/${uploadId}/status`),
  uploadNote: (provider: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', provider);
    return apiClient.post('/broker-sync/upload-note', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
  },
};

export const fiscalService = {
  getSummary: (year?: number) =>
    apiClient.get(`/fiscal/summary${year ? `?year=${year}` : ''}`),
  getOptimizer: (year?: number) =>
    apiClient.get(`/fiscal/optimizer${year ? `?year=${year}` : ''}`),
  previewSale: (data: {
    symbol: string;
    quantity: number;
    sellPrice: number;
    portfolioId?: string;
  }) => apiClient.post('/fiscal/sale-preview', data),
  getReport: (params: {
    type: 'fiscal' | 'transactions' | 'assets';
    year?: number;
    format?: 'json' | 'pdf';
  }) =>
    apiClient.get('/fiscal/report', {
      params,
      responseType: params.format === 'pdf' ? 'blob' : 'json',
    }),
};

export const leadsService = {
  capturePurchaseIntent: (
    email: string,
    planId: string,
    attribution: {
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    } = {},
  ): AxiosPromise<{success: boolean}> =>
    apiClient.post('/leads/purchase-intent', {email, planId, ...attribution}),
};

export {apiClient as api};
export default apiClient;
