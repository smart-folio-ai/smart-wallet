// O backend grava e devolve `avgPrice` (assets.model.ts). Os outros dois
// nomes nunca existiram em resposta alguma — ficam só como rede de segurança.
export function getAveragePrice(
  asset:
    | {avgPrice?: number; averagePrice?: number; average_price?: number}
    | null
    | undefined,
): number {
  return Number(
    asset?.avgPrice ?? asset?.averagePrice ?? asset?.average_price ?? 0,
  );
}

export function computePnl(
  totalValue: number,
  totalCost: number,
): {pnl: number | null; pnlPercentage: number | null} {
  // Sem custo base não há lucro a calcular. Devolver 0 aqui foi o que fez a
  // tela declarar que a carteira inteira era lucro.
  if (!(totalCost > 0)) {
    return {pnl: null, pnlPercentage: null};
  }

  const pnl = totalValue - totalCost;
  return {pnl, pnlPercentage: (pnl / totalCost) * 100};
}
