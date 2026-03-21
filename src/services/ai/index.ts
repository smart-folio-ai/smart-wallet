import {aiService} from '@/server/api/api';

export interface StockScore {
  score: number;
  rating: string;
  recommendation: string;
  details: string[];
}

export interface FiiScore {
  score: number;
  rating: string;
  recommendation: string;
  details: string[];
  critical_rejection: boolean;
}

export interface Forecast {
  symbol: string;
  ds: string[];
  yhat: number[];
  yhat_lower: number[];
  yhat_upper: number[];
}

export interface InvestmentScoreDetail {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface InvestmentScore {
  overall: number;
  diversification: number;
  risk: number;
  consistency: number;
  volatility: number;
  details: InvestmentScoreDetail;
}

export interface ErrorDetection {
  type: 'correlation' | 'concentration' | 'overvalued' | 'other';
  severity: 'low' | 'medium' | 'high';
  message: string;
  symbol?: string;
}

export interface OpportunityRadarItem {
  symbol: string;
  type: string;
  price: number;
  target_price: number;
  upside: number;
  rationale: string;
}

export interface AllocationItem {
  category: string;
  current: number;
  ideal: number;
}

export interface FeedItem {
  title: string;
  content: string;
  impact: 'positive' | 'negative' | 'neutral';
  symbol?: string;
}

export interface RebalancingResponse {
  ideal_allocation: AllocationItem[];
  top_moves: string[];
}

export interface AiAnalysisResult {
  portfolio_assessment: string;
  investment_score: InvestmentScore;
  error_detection: ErrorDetection[];
  opportunity_radar: OpportunityRadarItem[];
  risk_assessment: string;
  rebalancing?: RebalancingResponse;
  smart_feed?: FeedItem[];
  ai_analysis?: {
    investment_score?: InvestmentScore;
    portfolio_assessment?: string;
    error_detection?: ErrorDetection[];
    opportunity_radar?: OpportunityRadarItem[];
    rebalancing?: RebalancingResponse;
    smart_feed?: FeedItem[];
  };
}

export interface AiAnalysisPayload {
  user_id: string;
  profile_plan: 'free' | 'premium' | 'pro';
  portfolio: {
    id: string;
    name: string;
    cpf: string;
    assets: Array<{
      symbol: string;
      type: string;
      quantity: number;
      price: number;
      current_price: number;
      change_24h: number;
      metrics?: any;
    }>;
    total_value: number;
    plan: string;
  };
  risk_profile: 'conservative' | 'moderate' | 'aggressive';
}

export interface SimulationRequest {
  monthly_investment: number;
  years: number;
  current_portfolio_value: number;
  expected_annual_return?: number;
}

export interface SimulationResponse {
  total_invested: number;
  scenarios: {
    optimistic: number;
    neutral: number;
    pessimistic: number;
  };
  message: string;
}

export interface AiChatRequest {
  question: string;
  profile_plan?: 'free' | 'premium' | 'pro';
  context?: Record<string, unknown>;
}

export interface AiChatResponse {
  answer: string;
}

class AiAnalysisService {
  async analyze(payload: AiAnalysisPayload): Promise<AiAnalysisResult> {
    const response = await aiService.analyze(payload);
    return response.data;
  }

  async simulate(payload: SimulationRequest): Promise<SimulationResponse> {
    const response = await aiService.simulate(payload);
    return response.data;
  }

  async chat(payload: AiChatRequest): Promise<AiChatResponse> {
    const response = await aiService.chat(payload);
    return response.data;
  }
}

export const aiAnalysisService = new AiAnalysisService();
export default aiAnalysisService;
