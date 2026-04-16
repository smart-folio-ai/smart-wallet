import {aiAnalysisService} from '@/services/ai';

export interface AssetOpinionInput {
  symbol: string;
  name?: string;
  price?: number;
  change24h?: number;
  sector?: string;
  indicators?: {
    dividendYield?: number;
    pe?: number;
    pvp?: number;
    roe?: number;
    roic?: number;
    netMargin?: number;
    debtEbitda?: number;
  };
  valuation?: {
    grahamValue?: number;
    upside?: number;
  };
}

export interface AssetOpinion {
  summary: string;
  strength: string;
  attention: string;
  tags: string[];
}

type BenchmarkRating = 'TOP' | 'BOM' | 'EVITAR';
type BenchmarkRecommendation = 'COMPRA' | 'HOLD' | 'VENDA';

interface StockBenchmark {
  score: number;
  rating: BenchmarkRating;
  recommendation: BenchmarkRecommendation;
  details: string[];
}

function extractJsonCandidate(raw: string): string | null {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

export function parseAssetOpinion(rawAnswer: string): AssetOpinion | null {
  const jsonCandidate = extractJsonCandidate(rawAnswer);
  if (!jsonCandidate) return null;

  try {
    const parsed = JSON.parse(jsonCandidate);
    const summary = String(parsed?.summary || '').trim();
    const strength = String(parsed?.strength || '').trim();
    const attention = String(parsed?.attention || '').trim();
    const tags = Array.isArray(parsed?.tags)
      ? parsed.tags
          .map((value: unknown) => String(value || '').trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    if (!summary || !strength || !attention) return null;

    return {summary, strength, attention, tags};
  } catch {
    return null;
  }
}

function toContext(input: AssetOpinionInput): Record<string, unknown> {
  const benchmark = evaluateStockByBenchmark(input);

  return {
    asset: {
      symbol: input.symbol,
      name: input.name || '',
      sector: input.sector || '',
      price: input.price ?? null,
      change24h: input.change24h ?? null,
      indicators: {
        dividendYield: input.indicators?.dividendYield ?? null,
        pe: input.indicators?.pe ?? null,
        pvp: input.indicators?.pvp ?? null,
        roe: input.indicators?.roe ?? null,
        roic: input.indicators?.roic ?? null,
        netMargin: input.indicators?.netMargin ?? null,
        debtEbitda: input.indicators?.debtEbitda ?? null,
      },
      valuation: {
        grahamValue: input.valuation?.grahamValue ?? null,
        upside: input.valuation?.upside ?? null,
      },
    },
    benchmarkOpinion: benchmark,
  };
}

function buildPrompt(symbol: string): string {
  return [
    `Analise o ativo ${symbol} usando exclusivamente o contexto fornecido.`,
    'Siga o benchmarkOpinion como base principal de confiabilidade e qualidade.',
    'Sem marketing, sem inventar dados e sem texto genérico.',
    'A análise deve existir sempre: se o cenário for ruim, diga objetivamente por que é ruim.',
    'Retorne APENAS JSON válido no formato:',
    '{"summary":"...","strength":"...","attention":"...","tags":["...","..."]}',
    'Regras dos campos:',
    '- summary: 1 a 2 frases objetivas com classificação implícita (boa, neutra ou fraca).',
    '- strength: 1 frase curta com principal ponto forte real do ativo.',
    '- attention: 1 frase curta com principal ponto de atenção.',
    '- tags: até 3 rótulos curtos alinhados ao benchmarkOpinion.',
  ].join('\n');
}

function evaluateStockByBenchmark(input: AssetOpinionInput): StockBenchmark {
  const roePct = Number(input.indicators?.roe ?? NaN) * 100;
  const dividendYieldPct = Number(input.indicators?.dividendYield ?? NaN) * 100;
  const debtEbitda = Number(input.indicators?.debtEbitda ?? NaN);

  const checks: Array<{ok: boolean; weight: number; detail: string}> = [];

  if (Number.isFinite(roePct)) {
    checks.push({ok: roePct > 15, weight: 20, detail: 'ROE > 15%'});
  }
  if (Number.isFinite(dividendYieldPct)) {
    checks.push({ok: dividendYieldPct > 5, weight: 15, detail: 'DY > 5%'});
  }
  if (Number.isFinite(debtEbitda)) {
    checks.push({
      ok: debtEbitda < 2,
      weight: 20,
      detail: 'Dívida/EBITDA < 2x',
    });
  }

  const availableWeight = checks.reduce((sum, item) => sum + item.weight, 0);
  const rawScore = checks
    .filter((item) => item.ok)
    .reduce((sum, item) => sum + item.weight, 0);
  const score =
    availableWeight > 0
      ? Math.round((rawScore / availableWeight) * 100)
      : 50;

  const rating: BenchmarkRating =
    score >= 80 ? 'TOP' : score >= 50 ? 'BOM' : 'EVITAR';
  const recommendation: BenchmarkRecommendation =
    score >= 70 ? 'COMPRA' : score >= 40 ? 'HOLD' : 'VENDA';
  const details = checks.filter((item) => item.ok).map((item) => item.detail);

  return {score, rating, recommendation, details};
}

function buildDeterministicOpinion(
  input: AssetOpinionInput,
  benchmark: StockBenchmark,
): AssetOpinion {
  const symbol = input.symbol;
  const ratingText =
    benchmark.rating === 'TOP'
      ? 'qualidade elevada'
      : benchmark.rating === 'BOM'
        ? 'qualidade intermediária'
        : 'qualidade fraca';

  const summary = `${symbol} apresenta ${ratingText} no padrão Trackerr (score ${benchmark.score}/100), com recomendação ${benchmark.recommendation}.`;
  const strength =
    benchmark.details[0] ||
    `${symbol} mantém sinais mistos, mas com pontos objetivos para monitoramento.`;
  const attention =
    benchmark.recommendation === 'VENDA'
      ? 'Os sinais de risco superam os de qualidade neste momento.'
      : benchmark.recommendation === 'HOLD'
        ? 'A relação risco-retorno pede cautela e acompanhamento dos próximos resultados.'
        : 'Apesar do viés positivo, acompanhe execução e contexto macroeconômico.';
  const tags = [
    `score_${benchmark.score}`,
    benchmark.rating.toLowerCase(),
    benchmark.recommendation.toLowerCase(),
  ];

  return {summary, strength, attention, tags};
}

export async function getAssetOpinion(
  input: AssetOpinionInput,
): Promise<AssetOpinion> {
  const benchmark = evaluateStockByBenchmark(input);
  const deterministicFallback = buildDeterministicOpinion(input, benchmark);

  try {
    const response = await aiAnalysisService.chat({
      question: buildPrompt(input.symbol),
      context: toContext(input),
      profile_plan: 'premium',
    });
    const parsed = parseAssetOpinion(String(response?.answer || ''));
    return parsed || deterministicFallback;
  } catch {
    return deterministicFallback;
  }
}
