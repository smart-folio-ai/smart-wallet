import {ICreateUser} from '@/interface/authentication';
import {apiUrlDevelopment, apiUrlProduction, isDev} from '@/utils/env';
import axios from 'axios';

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
  register: (data: ICreateUser) => apiClient.post('/users/create', data),
  logout: (token: string) => apiClient.post('/auth/signout', {token}),
};

export const profileService = {
  getProfile: (userId: string) => apiClient.get(`profile/${userId}`),
  getUser: (userId: string) => apiClient.get(`users/${userId}`),
  getAllAddress: () => apiClient.get(`addresses/addresses`),
  getAddressUser: (userId: string) => apiClient.get(`addresses/user/${userId}`),
};

// export const portfolioService = {
//   getSummary: () => apiClient.get('/portfolio/summary'),
//   getAssets: () => apiClient.get('/portfolio/assets'),
//   getAssetDetails: (assetId: string) =>
//     apiClient.get(`/portfolio/assets/${assetId}`),
//   getTransactions: (params?: Record<string, unknown>) =>
//     apiClient.get('/portfolio/transactions', {params}),
// };

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

// export const subscriptionService = {
//   getPlans: () => apiClient.get('/subscription/plans'),
//   getCurrentPlan: () => apiClient.get('/subscription/current'),
//   upgradePlan: (planId: string) =>
//     apiClient.post('/subscription/upgrade', {planId}),
// };

export default apiClient;
