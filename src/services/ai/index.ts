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

/**
 * Espelha `AssetOpinionOutput` do server (POST /ai/asset-opinion).
 * Determinístico — sem campo `source`, porque nenhum caminho hoje produz
 * texto de modelo. Volta se/quando a narrativa por IA validada existir.
 */
export interface AssetOpinionResponse {
  symbol: string;
  summary: string;
  strength: string;
  attention: string;
  tags: string[];
  scoreOverall: number;
  status: 'ok' | 'degraded';
}

/**
 * Espelha `PortfolioErrorRadarOutput` do server (GET /ai/error-radar).
 * `type` é a categoria ampla do alerta; `code` é o identificador fino, útil
 * pra depuração mas não pensado pra exibição direta.
 */
export type PortfolioErrorRadarAlertType =
  | 'concentration'
  | 'diversification'
  | 'volatility'
  | 'other';

export interface PortfolioErrorRadarAlert {
  code: string;
  type: PortfolioErrorRadarAlertType;
  severity: 'low' | 'medium' | 'high';
  message: string;
  symbol?: string;
}

export interface PortfolioErrorRadarResponse {
  modelVersion: 'portfolio_error_radar_v1';
  status: 'ok' | 'insufficient_data';
  riskLevel: 'low' | 'medium' | 'high' | null;
  alerts: PortfolioErrorRadarAlert[];
  positionsCount: number;
}

/** Espelha FutureSimulatorHorizon do server. */
export type FutureSimulatorHorizon = '6m' | '1y' | '5y' | '10y';

export interface FutureSimulatorScenario {
  label: 'pessimistic' | 'base' | 'optimistic';
  annualReturnPct: number;
  projectedValue: number;
  range: {lower: number; upper: number};
  projectedDividendFlow: {monthly: number; annual: number};
}

/**
 * Espelha FutureSimulatorOutput do server (POST /ai/future-simulator).
 * Cenários de retorno (2%/8%/14% ao ano) são fixos no server, não
 * parâmetro de entrada — vêm expostos em `assumptions` pra transparência,
 * não pra configuração pelo usuário.
 */
export interface FutureSimulatorResponse {
  modelVersion: 'future_simulator_v1';
  horizon: FutureSimulatorHorizon;
  months: number;
  currentPortfolioValue: number;
  monthlyContribution: number;
  scenarios: {
    pessimistic: FutureSimulatorScenario;
    base: FutureSimulatorScenario;
    optimistic: FutureSimulatorScenario;
  };
  assumptions: {
    contributionFrequency: 'monthly';
    scenarioReturnsAnnualPct: {
      pessimistic: number;
      base: number;
      optimistic: number;
    };
  };
  dividendProjection: {
    current: {monthly: number; annual: number};
  };
  limitations: string[];
  confidence: 'high' | 'medium' | 'low';
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

/** Espelha AppendChatMessageRequestDto do backend (src/ai/chat-history). */
export interface AppendChatHistoryMessagePayload {
  clientId: string;
  role: 'user' | 'assistant';
  text: string;
  status?: 'ok' | 'error';
  retryQuestion?: string;
  payload?: Record<string, unknown>;
  aiGenerated?: boolean;
}

export interface ChatHistoryMessage extends AppendChatHistoryMessagePayload {
  userId?: string;
  createdAt?: string;
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

  async assetOpinion(symbol: string): Promise<AssetOpinionResponse> {
    const response = await aiService.assetOpinion(symbol);
    return response.data;
  }

  async errorRadar(): Promise<PortfolioErrorRadarResponse> {
    const response = await aiService.errorRadar();
    return response.data;
  }

  async futureSimulator(payload: {
    horizon: FutureSimulatorHorizon;
    monthlyContribution?: number;
  }): Promise<FutureSimulatorResponse> {
    const response = await aiService.futureSimulator(payload);
    return response.data;
  }

  async getChatHistory(): Promise<ChatHistoryMessage[]> {
    const response = await aiService.getChatHistory();
    return response.data;
  }

  async appendChatHistoryMessage(
    payload: AppendChatHistoryMessagePayload,
  ): Promise<ChatHistoryMessage> {
    const response = await aiService.appendChatHistoryMessage(payload);
    return response.data;
  }
}

export const aiAnalysisService = new AiAnalysisService();
export default aiAnalysisService;
