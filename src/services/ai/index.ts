import {aiService as apiAiService} from '@/server/api/api';
import {jwtDecode} from 'jwt-decode';

export type AiAnalysisPayload = {
  profile_plan: 'free' | 'premium' | 'pro';
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
  portfolio: {
    id: string;
    name: string;
    cpf: string;
    assets: Array<{
      symbol: string;
      type: 'stock' | 'fii' | 'crypto' | 'etf';
      quantity: number;
      price: number;
      current_price: number;
      change_24h: number;
      metrics?: Record<string, any>;
    }>;
    total_value: number;
    plan: 'free' | 'premium' | 'pro';
  };
  address: {city?: string; state?: string; country?: string};
  preferences: {language?: string; theme?: string};
};

export type StockScore = {
  score: number;
  rating: string;
  details: string[];
  recommendation: 'COMPRA' | 'HOLD' | 'VENDA';
};

export type FiiScore = StockScore & {critical_rejection?: boolean};

export type Forecast = {
  current: number;
  forecast_30d: number;
  confidence_lower: number;
  confidence_upper: number;
  trend: 'up' | 'down';
};

export type AiAnalysisResult = {
  plan: string;
  stock_scores: Record<string, StockScore>;
  fii_scores: Record<string, FiiScore>;
  forecasts?: Record<string, Forecast>;
  claude_analysis?: any;
  message?: string;
  timestamp: string;
};

class AiAnalysisService {
  /**
   * Realiza análise de portfolio chamando POST /ai/analyze no backend NestJS.
   * O backend faz o proxy para o trakker-ia (FastAPI).
   */
  async analyze(payload: AiAnalysisPayload): Promise<AiAnalysisResult> {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('Sessão expirada. Faça login novamente.');

    const decoded = jwtDecode<{userId: string}>(token);
    const response = await apiAiService.analyze({
      ...payload,
      user_id: decoded.userId,
    });
    return response.data;
  }
}

export default new AiAnalysisService();
