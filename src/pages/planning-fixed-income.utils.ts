export type FixedIncomeInput = {
  initialCapital: number;
  years: number;
  annualInflationRate: number;
  annualSelicRate: number;
  annualPrefixRate: number;
  annualIpcaSpreadRate: number;
  annualSelicSpreadRate: number;
  annualLcaRate: number;
  taxableIrRate: number;
};

export type FixedIncomeScenarioKey = 'prefixado' | 'ipca_plus' | 'selic_plus' | 'lca';

export type FixedIncomeScenarioResult = {
  key: FixedIncomeScenarioKey;
  label: string;
  annualGrossRate: number;
  taxRate: number;
  nominalFinalValue: number;
  realFinalValue: number;
  nominalProfit: number;
  realProfit: number;
  annualRealRate: number;
};

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function safeMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

function computeNetFinalValue(
  initialCapital: number,
  annualGrossRate: number,
  years: number,
  taxRate: number,
): number {
  const grossFinal = initialCapital * Math.pow(1 + annualGrossRate, years);
  const grossProfit = grossFinal - initialCapital;
  const netProfit = grossProfit * (1 - taxRate);
  return initialCapital + netProfit;
}

function computeAnnualRealRate(realFinalValue: number, initialCapital: number, years: number): number {
  if (initialCapital <= 0 || years <= 0 || realFinalValue <= 0) return 0;
  return Math.pow(realFinalValue / initialCapital, 1 / years) - 1;
}

export function calculateFixedIncomeComparison(
  input: FixedIncomeInput,
): FixedIncomeScenarioResult[] {
  const initialCapital = clampNonNegative(input.initialCapital);
  const years = clampNonNegative(input.years);
  const inflation = clampNonNegative(input.annualInflationRate);
  const selic = clampNonNegative(input.annualSelicRate);
  const prefix = clampNonNegative(input.annualPrefixRate);
  const ipcaSpread = clampNonNegative(input.annualIpcaSpreadRate);
  const selicSpread = clampNonNegative(input.annualSelicSpreadRate);
  const lca = clampNonNegative(input.annualLcaRate);
  const irRate = Math.min(1, clampNonNegative(input.taxableIrRate));

  const scenarios: Array<{
    key: FixedIncomeScenarioKey;
    label: string;
    annualGrossRate: number;
    taxRate: number;
  }> = [
    {
      key: 'prefixado',
      label: 'Tesouro Prefixado',
      annualGrossRate: prefix,
      taxRate: irRate,
    },
    {
      key: 'ipca_plus',
      label: 'Tesouro IPCA+',
      annualGrossRate: (1 + inflation) * (1 + ipcaSpread) - 1,
      taxRate: irRate,
    },
    {
      key: 'selic_plus',
      label: 'Tesouro Selic+',
      annualGrossRate: (1 + selic) * (1 + selicSpread) - 1,
      taxRate: irRate,
    },
    {
      key: 'lca',
      label: 'LCA (isento IR)',
      annualGrossRate: lca,
      taxRate: 0,
    },
  ];

  const inflationFactor = Math.pow(1 + inflation, years);

  return scenarios.map((scenario) => {
    const nominalFinalValue = computeNetFinalValue(
      initialCapital,
      scenario.annualGrossRate,
      years,
      scenario.taxRate,
    );
    const realFinalValue =
      inflationFactor > 0 ? nominalFinalValue / inflationFactor : nominalFinalValue;
    const annualRealRate = computeAnnualRealRate(realFinalValue, initialCapital, years);

    return {
      key: scenario.key,
      label: scenario.label,
      annualGrossRate: scenario.annualGrossRate,
      taxRate: scenario.taxRate,
      nominalFinalValue: safeMoney(nominalFinalValue),
      realFinalValue: safeMoney(realFinalValue),
      nominalProfit: safeMoney(nominalFinalValue - initialCapital),
      realProfit: safeMoney(realFinalValue - initialCapital),
      annualRealRate,
    };
  });
}
