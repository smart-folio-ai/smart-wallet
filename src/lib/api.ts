import axios from 'axios';

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL_DEVELOPMENT ||
    import.meta.env.VITE_API_URL_DEVELOPMENT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Serviços de API
export const authService = {
  login: (email: string, password: string, keepConnected: boolean) =>
    apiClient.post('/auth/signin', {email, password, keepConnected}),
  register: (name: string, email: string, password: string) =>
    apiClient.post('/auth/register', {name, email, password}),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
};

// export const portfolioService = {
//   getSummary: () => apiClient.get('/portfolio/summary'),
//   getAssets: () => apiClient.get('/portfolio/assets'),
//   getAssetDetails: (assetId: string) =>
//     apiClient.get(`/portfolio/assets/${assetId}`),
//   getTransactions: (params?: any) =>
//     apiClient.get('/portfolio/transactions', {params}),
// };

// export const connectionsService = {
//   getBrokerages: () => apiClient.get('/connections/brokerages'),
//   getCryptoExchanges: () => apiClient.get('/connections/crypto-exchanges'),
//   connectAccount: (type: string, credentials: any) =>
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
//   updateSettings: (settings: any) => apiClient.put('/settings', settings),
// };

export const subscriptionService = {
  getPlans: () => apiClient.get('/subscription/plans'),
  getCurrentPlan: () => apiClient.get('/subscription/current'),
  upgradePlan: (planId: string) =>
    apiClient.post('/subscription/upgrade', {planId}),
};

export default apiClient;
