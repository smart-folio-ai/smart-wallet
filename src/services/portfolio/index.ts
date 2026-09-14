import apiClient from '@/server/api/api';

export type UpcomingDividend = {
  id: string;
  portfolioId: string;
  symbol: string;
  name?: string;
  paymentType: 'JCP' | 'DIVIDEND' | 'RENDIMENTO' | 'OTHER';
  expectedPaymentDate: string;
  quantity: number;
  unitValue: number;
  netValue: number;
};

export type UpcomingDividendsResponse = {
  windowDays: number;
  totalNetValue: number;
  items: UpcomingDividend[];
};

class PortfolioService {
  async getPortfolios() {
    const response = await apiClient.get('/portfolio');
    return response.data;
  }

  async getPortfolio(id: string) {
    const response = await apiClient.get(`/portfolio/${id}`);
    return response.data;
  }

  async getPortfolioHistory(id: string) {
    const response = await apiClient.get(`/portfolio/${id}/history`);
    return response.data;
  }

  async importB3Report(portfolioId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Using multipart/form-data for file upload
    const response = await apiClient.post(`/portfolio/${portfolioId}/import-b3`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async importB3Transactions(portfolioId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      `/portfolio/${portfolioId}/import-b3-transactions`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  }

  /** Proventos anunciados e ainda não pagos (relatório de Eventos da B3). */
  async getUpcomingDividends(days = 45): Promise<UpcomingDividendsResponse> {
    const response = await apiClient.get('/portfolio/upcoming-dividends', {
      params: {days},
    });
    return response.data;
  }

  /** Qualquer um dos arquivos da B3 — o backend decide o importador pelo conteúdo. */
  async importB3Auto(portfolioId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(
      `/portfolio/${portfolioId}/import-b3-auto`,
      formData,
      {headers: {'Content-Type': 'multipart/form-data'}},
    );
    return response.data;
  }

  async createPortfolio(data: {name: string; ownerType: string; cpf?: string}) {
    const response = await apiClient.post('/portfolio/create', data);
    return response.data;
  }

  async updatePortfolio(
    id: string,
    data: {name?: string; description?: string},
  ) {
    const response = await apiClient.put(`/portfolio/${id}`, data);
    return response.data;
  }

  async deletePortfolio(id: string) {
    const response = await apiClient.delete(`/portfolio/${id}`);
    return response.data;
  }

  async getSummary() {
    const response = await apiClient.get('/portfolio/summary');
    return response.data;
  }

  async getAssets() {
    const response = await apiClient.get('/portfolio/assets');
    return response.data;
  }

  async getAssetDetails(assetId: string) {
    const response = await apiClient.get(`/portfolio/assets/${assetId}`);
    return response.data;
  }

  async getTransactions(params?: Record<string, unknown>) {
    const response = await apiClient.get('/portfolio/transactions', {params});
    return response.data;
  }

  async addAssetToPortfolio(portfolioId: string, asset: any) {
    const response = await apiClient.post(
      `/portfolio/${portfolioId}/asset`,
      asset,
    );
    return response.data;
  }

  async updateAsset(assetId: string, asset: any) {
    const response = await apiClient.put(`/portfolio/assets/${assetId}`, asset);
    return response.data;
  }

  async deleteAsset(assetId: string) {
    const response = await apiClient.delete(`/portfolio/assets/${assetId}`);
    return response.data;
  }

  async updateTransaction(transactionId: string, transaction: any) {
    const response = await apiClient.put(
      `/portfolio/transactions/${transactionId}`,
      transaction,
    );
    return response.data;
  }

  async deleteTransaction(transactionId: string) {
    const response = await apiClient.delete(
      `/portfolio/transactions/${transactionId}`,
    );
    return response.data;
  }

  async addTransaction(transaction: any) {
    const response = await apiClient.post(
      '/portfolio/transactions',
      transaction,
    );
    return response.data;
  }

  async getTargetAllocation(): Promise<Partial<
    Record<'stocks' | 'crypto' | 'fiis' | 'other', number>
  > | null> {
    const response = await apiClient.get('/portfolio/target-allocation');
    return response.data;
  }

  async updateTargetAllocation(
    data: Partial<Record<'stocks' | 'crypto' | 'fiis' | 'other', number>>,
  ) {
    const response = await apiClient.put('/portfolio/target-allocation', data);
    return response.data;
  }
}

export default new PortfolioService();
