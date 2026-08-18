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

/**
 * Score de carteira determinístico, vindo de GET /ai/portfolio-score.
 * Espelha `PortfolioScoreOutput` do server.
 *
 * Substitui o `InvestmentScore` acima, que era gerado pelo LLM. Note que só
 * traz diversificação e risco: consistência e volatilidade não têm cálculo
 * determinístico e foram deliberadamente deixadas de fora em vez de
 * inventadas (TRA-5).
 */
export interface PortfolioScoreDimension {
  key: 'diversification' | 'risk';
  /** Sempre normalizado para "maior = melhor", inclusive risco. */
  score: number;
  weight: number;
}

export interface PortfolioScoreResponse {
  modelVersion: 'portfolio_score_v1';
  /** null quando não há posição suficiente. Nunca 0 como placeholder. */
  overall: number | null;
  status: 'ok' | 'insufficient_data';
  dimensions: PortfolioScoreDimension[];
  diversificationStatus: 'poor' | 'moderate' | 'good' | 'excellent' | null;
  riskLevel: 'low' | 'medium' | 'high' | null;
  flags: Array<{
    code: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
  }>;
  positionsCount: number;
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
  investorProfile?: 'renda' | 'crescimento' | 'conservador' | 'agressivo';
  copilotFlow?:
    | 'sell_asset'
    | 'rebalance_portfolio'
    | 'reduce_risk_20'
    | 'committee_mode';
  decisionFlow?: {
    action: 'sell' | 'rebalance' | 'reduce_risk';
    ticker?: string;
    quantity?: number;
    sellPrice?: number;
    targetRiskReductionPct?: number;
  };
}

export interface AiChatResponse {
  answer: string;
}

export interface AiIntelligentChatResponse {
  intent: string;
  deterministic: boolean;
  message: string;
  portfolioFacts?: Record<string, unknown> | null;
  externalData?: Record<string, unknown> | null;
  estimates?: Record<string, unknown> | null;
  unavailable?: string[];
}

export interface TrackerrScoreResponse {
  symbol: string;
  status: 'ok' | 'degraded';
  overall: number;
  overallScore: number;
  weights: Record<string, number>;
  pillars: Array<{
    pillar: 'qualidade' | 'risco' | 'valuation' | 'fiscal' | 'portfolio_fit';
    weight: number;
    score: number;
    weightedScore: number;
    reasonCodes: Array<{
      code: string;
      direction: 'up' | 'down' | 'neutral';
      description: string;
    }>;
  }>;
  reasonCodes: {
    upward: string[];
    downward: string[];
  };
  warnings: string[];
  explanation: {
    summary: string;
    topPositiveDrivers: string[];
    topNegativeDrivers: string[];
  };
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

  async intelligentChat(
    payload: AiChatRequest,
  ): Promise<AiIntelligentChatResponse> {
    const response = await aiService.intelligentChat(payload);
    return response.data;
  }

  async trackerrScore(payload: {
    symbol: string;
    previousPillarScores?: Record<string, number>;
  }): Promise<TrackerrScoreResponse> {
    const response = await aiService.trackerrScore(payload);
    return response.data;
  }

  async portfolioScore(): Promise<PortfolioScoreResponse> {
    const response = await aiService.portfolioScore();
    return response.data;
  }
}

export const aiAnalysisService = new AiAnalysisService();
export default aiAnalysisService;
