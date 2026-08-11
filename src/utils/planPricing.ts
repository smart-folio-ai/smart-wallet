export function normalizePlanPricing(plan: {
  price: number;
  annualPrice?: number;
}): {monthlyPrice: number; annualPrice: number; hasRealAnnualPrice: boolean} {
  const hasRealAnnualPrice =
    typeof plan.annualPrice === 'number' && plan.annualPrice > 0;

  return {
    monthlyPrice: plan.price,
    annualPrice: hasRealAnnualPrice ? plan.annualPrice! : plan.price,
    hasRealAnnualPrice,
  };
}
