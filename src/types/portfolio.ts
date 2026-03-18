export interface Asset {
  _id: string;
  symbol: string;
  name: string;
  price: number;
  currentPrice?: number;
  change24h: number;
  amount: number;
  value: number;
  allocation: number;
  type: 'stock' | 'crypto' | 'fii' | 'etf' | 'fund' | 'other';
  dividendYield?: number;
  lastDividend?: number;
  sector?: string;
  purchasePrice?: number;
  avgPrice?: number;
  purchaseDate?: string;
  profitLoss?: number;
  profitLossPercentage?: number;
  aiRecommendation?: 'buy' | 'hold' | 'sell';
  aiConfidence?: number;
  history?: {
    date: string;
    price: number;
  }[];
  dividendHistory?: {
    date: string;
    value: number;
  }[];
}

export interface AssetPerformance {
  period: string;
  value: number;
  change: number;
}

export interface SortConfig {
  key: keyof Asset | '';
  direction: 'asc' | 'desc';
}
