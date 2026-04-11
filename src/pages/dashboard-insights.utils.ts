export interface DashboardRecommendedAction {
  title: string;
  reason: string;
}

export interface DashboardEventItem {
  title: string;
  detail: string;
  tag: 'Dividendo' | 'Resultado' | 'Fato relevante' | 'RI' | 'Watchlist';
}

interface RecommendedActionsInput {
  concentrationName?: string | null;
  concentrationValue?: number | null;
  taxSimulationSymbol?: string | null;
  taxSimulationSavings?: number | null;
  hasTargetAllocation: boolean;
  allocationDriftLabel?: string | null;
  riSymbol?: string | null;
  internationalExposurePct?: number | null;
  dollarVariationPct?: number | null;
}

interface DashboardEventsInput {
  futureDividends: Array<{symbol: string; date: string; value: number}>;
  watchlistSignals: string[];
  topSymbol?: string | null;
}

interface RiskSnapshotInput {
  volatilityPct: number | null;
  concentrationName?: string | null;
  concentrationValue?: number | null;
  classExposureCount: number;
  dominantSectorName?: string | null;
  dominantSectorPct?: number | null;
}

export interface RiskSnapshot {
  riskScore: number;
  diversificationScore: number;
  riskLevel: 'Baixa' | 'Moderada' | 'Alta';
  dominantClassText: string;
  dominantSectorText: string;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const formatDashboardDate = (isoDate: string): string => {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'data indisponivel';
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
};

export const buildRecommendedActionsQueue = (
  input: RecommendedActionsInput,
): DashboardRecommendedAction[] => {
  const actions: DashboardRecommendedAction[] = [];

  if (input.concentrationName && Number.isFinite(input.concentrationValue)) {
    actions.push({
      title: 'Revisar concentração da carteira',
      reason: `${input.concentrationName} concentra ${(input.concentrationValue || 0).toFixed(2)}% do patrimônio.`,
    });
  }

  if (input.taxSimulationSymbol) {
    const savingsText =
      typeof input.taxSimulationSavings === 'number'
        ? ` potencial de economia de R$ ${input.taxSimulationSavings.toFixed(2).replace('.', ',')}.`
        : '.';

    actions.push({
      title: `Simular venda de ${input.taxSimulationSymbol}`,
      reason: `Valide impacto tributário e liquidez antes de decidir${savingsText}`,
    });
  }

  actions.push({
    title: 'Configurar meta de alocação',
    reason: input.hasTargetAllocation
      ? input.allocationDriftLabel || 'Há desvio entre alocação atual e objetivo definido.'
      : 'Definir metas por classe melhora disciplina de rebalanceamento.',
  });

  if (input.riSymbol) {
    actions.push({
      title: `Ver novo RI de ${input.riSymbol}`,
      reason: 'Acompanhe resultado, guidance e fatos relevantes mais recentes.',
    });
  }

  if (typeof input.internationalExposurePct === 'number') {
    const dollarMove =
      typeof input.dollarVariationPct === 'number'
        ? ` Dólar no dia: ${input.dollarVariationPct >= 0 ? '+' : ''}${input.dollarVariationPct.toFixed(2)}%.`
        : '';

    actions.push({
      title: 'Ajustar exposição internacional',
      reason: `Exposição atual aproximada em ${input.internationalExposurePct.toFixed(2)}%.${dollarMove}`,
    });
  }

  return actions.slice(0, 5);
};

export const buildDashboardEventsFeed = (
  input: DashboardEventsInput,
): DashboardEventItem[] => {
  const events: DashboardEventItem[] = [];

  for (const item of input.futureDividends.slice(0, 3)) {
    events.push({
      tag: 'Dividendo',
      title: `${item.symbol} - provento previsto`,
      detail: `Pagamento estimado de R$ ${item.value.toFixed(2).replace('.', ',')} em ${formatDashboardDate(item.date)}.`,
    });
  }

  if (input.topSymbol) {
    events.push({
      tag: 'Resultado',
      title: `Próximo resultado de ${input.topSymbol}`,
      detail: 'Calendário oficial não integrado na API atual; monitoramento sugerido no RI oficial.',
    });

    events.push({
      tag: 'Fato relevante',
      title: `Fatos relevantes de ${input.topSymbol}`,
      detail: 'Acompanhar comunicados relevantes para evitar surpresa de risco/evento.',
    });

    events.push({
      tag: 'RI',
      title: `Documentos de RI - ${input.topSymbol}`,
      detail: 'Checar release, apresentação e comunicados mais recentes.',
    });
  }

  for (const signal of input.watchlistSignals.slice(0, 2)) {
    events.push({
      tag: 'Watchlist',
      title: 'Watchlist em destaque',
      detail: signal,
    });
  }

  return events.slice(0, 6);
};

export const buildRiskSnapshot = (input: RiskSnapshotInput): RiskSnapshot => {
  const volatilityRisk =
    input.volatilityPct === null ? 20 : clamp(input.volatilityPct * 12, 8, 50);
  const concentrationRisk = clamp(
    ((input.concentrationValue || 0) - 20) * 1.4,
    0,
    30,
  );
  const classRisk =
    input.classExposureCount >= 4
      ? 2
      : input.classExposureCount === 3
        ? 8
        : input.classExposureCount === 2
          ? 16
          : 24;
  const sectorRisk = clamp(((input.dominantSectorPct || 0) - 20) * 0.8, 0, 20);

  const riskScore = Math.round(
    clamp(volatilityRisk + concentrationRisk + classRisk + sectorRisk, 0, 100),
  );
  const diversificationScore = Math.round(clamp(100 - (concentrationRisk + classRisk * 1.4), 0, 100));

  const riskLevel: RiskSnapshot['riskLevel'] =
    riskScore >= 66 ? 'Alta' : riskScore >= 36 ? 'Moderada' : 'Baixa';

  return {
    riskScore,
    diversificationScore,
    riskLevel,
    dominantClassText:
      input.concentrationName && Number.isFinite(input.concentrationValue)
        ? `${input.concentrationName} (${(input.concentrationValue || 0).toFixed(2)}%)`
        : 'Sem dados suficientes',
    dominantSectorText:
      input.dominantSectorName && Number.isFinite(input.dominantSectorPct)
        ? `${input.dominantSectorName} (${(input.dominantSectorPct || 0).toFixed(2)}%)`
        : 'Setor dominante indisponível',
  };
};
