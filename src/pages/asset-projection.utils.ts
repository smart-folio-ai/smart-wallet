export type AssetProjectionInput = {
  currentValue: number;
  monthlyContribution: number;
  years: number;
  annualReturnRate: number;
  annualInflationRate: number;
  taxRate: number;
};

export type AssetProjectionResult = {
  totalContributed: number;
  grossFinalValue: number;
  netFinalValue: number;
  nominalProfitAfterTax: number;
  realFinalValue: number;
  realProfitAfterTax: number;
  annualRealRate: number;
};

function clampNonNegative(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, value);
}

function clampRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function toMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

export function calculateAssetProjection(
  input: AssetProjectionInput,
): AssetProjectionResult {
  const currentValue = clampNonNegative(input.currentValue);
  const monthlyContribution = clampNonNegative(input.monthlyContribution);
  const years = clampNonNegative(input.years);
  const annualReturnRate = clampRate(input.annualReturnRate);
  const annualInflationRate = clampRate(input.annualInflationRate);
  const taxRate = clampRate(input.taxRate);

  if (years <= 0) {
    return {
      totalContributed: toMoney(currentValue),
      grossFinalValue: toMoney(currentValue),
      netFinalValue: toMoney(currentValue),
      nominalProfitAfterTax: 0,
      realFinalValue: toMoney(currentValue),
      realProfitAfterTax: 0,
      annualRealRate: 0,
    };
  }

  const totalMonths = Math.round(years * 12);
  const monthlyRate = Math.pow(1 + annualReturnRate, 1 / 12) - 1;
  let grossFinalValue = currentValue;

  for (let month = 0; month < totalMonths; month += 1) {
    grossFinalValue = grossFinalValue * (1 + monthlyRate) + monthlyContribution;
  }

  const totalContributed = currentValue + monthlyContribution * totalMonths;
  const grossProfit = Math.max(0, grossFinalValue - totalContributed);
  const taxOnProfit = grossProfit * taxRate;
  const netFinalValue = grossFinalValue - taxOnProfit;
  const nominalProfitAfterTax = Math.max(0, netFinalValue - totalContributed);
  const inflationFactor = Math.pow(1 + annualInflationRate, years);
  const realFinalValue =
    inflationFactor > 0 ? netFinalValue / inflationFactor : netFinalValue;
  const realProfitAfterTax = realFinalValue - totalContributed;
  const annualRealRate =
    totalContributed > 0 && realFinalValue > 0
      ? Math.pow(realFinalValue / totalContributed, 1 / years) - 1
      : 0;

  return {
    totalContributed: toMoney(totalContributed),
    grossFinalValue: toMoney(grossFinalValue),
    netFinalValue: toMoney(netFinalValue),
    nominalProfitAfterTax: toMoney(nominalProfitAfterTax),
    realFinalValue: toMoney(realFinalValue),
    realProfitAfterTax: toMoney(realProfitAfterTax),
    annualRealRate,
  };
}

export function getDefaultProjectionAnnualReturn(assetType?: string): number {
  const normalized = String(assetType || '').trim().toLowerCase();
  if (normalized === 'crypto') return 0.18;
  if (normalized === 'fii') return 0.12;
  if (normalized === 'stock' || normalized === 'etf') return 0.14;
  if (normalized === 'fund') return 0.105;
  return 0.1;
}

export function getDefaultProjectionTaxRate(assetType?: string): number {
  const normalized = String(assetType || '').trim().toLowerCase();
  if (normalized === 'fund') return 0.15;
  if (normalized === 'stock' || normalized === 'etf' || normalized === 'crypto')
    return 0.15;
  if (normalized === 'fii') return 0.2;
  return 0.15;
}
