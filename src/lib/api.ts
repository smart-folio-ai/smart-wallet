import {apiUrlDevelopment, apiUrlProduction, isDev} from '@/utils/env';
import axios from 'axios';
// import './interceptor';+-

console.log('apiUrlDevelopment', apiUrlDevelopment);
console.log('apiUrlProduction', apiUrlProduction);

const apiClient = axios.create({
  baseURL: isDev ? apiUrlDevelopment : apiUrlProduction,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

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

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refresh_token');
    const urlResponse =
      import.meta.env.VITE_API_URL_DEVELOPMENT + '/auth/refresh-token';

    if (
      error.response?.status === 401 &&
      refreshToken &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const {data} = await axios.post(urlResponse, {refreshToken});

        const newAccessToken = data.accessToken;
        localStorage.setItem('auth_token', newAccessToken);
        onRefreshed(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Serviços de API
export const authService = {
  login: (email: string, password: string, keepConnected: boolean) =>
    apiClient.post('/auth/signin', {email, password, keepConnected}),
  register: (name: string, email: string, password: string) =>
    apiClient.post('/auth/register', {name, email, password}),
  logout: (token: string) => apiClient.post('/auth/signout', {token}),
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
