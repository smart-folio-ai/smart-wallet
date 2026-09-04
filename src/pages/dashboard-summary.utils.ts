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

// O feed de cotações (brapi/yahoo) pode devolver o ativo sem `currentPrice` —
// tipicamente quando o ticker foi renomeado, o mercado está fechado sem
// snapshot, ou o provider está fora do ar. Nesses casos o backend costuma
// preencher `total` com o último preço conhecido (ou com o próprio avgPrice),
// o que faz P&L "zerado" ou gráfico chapado — falsa sensação de que nada
// mudou. Este helper existe para termos um único ponto que decide se o preço
// vivo do ativo é confiável.
export function hasFreshQuote(
  asset:
    | {currentPrice?: number | null; price?: number | null}
    | null
    | undefined,
): boolean {
  const raw = asset?.currentPrice;
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0;
}

export interface MarketDataStatus {
  isStale: boolean;
  staleCount: number;
  totalCount: number;
  staleSymbols: string[];
}

// Consolida o estado do feed para uma lista de ativos. `isStale` fica true
// assim que qualquer posição relevante ficou sem cotação — o banner do topo
// da tela usa isso para avisar o usuário em vez de mostrar zeros mentirosos.
export function deriveMarketDataStatus(
  assets:
    | ReadonlyArray<{
        symbol?: string | null;
        currentPrice?: number | null;
        price?: number | null;
        quantity?: number | null;
      }>
    | null
    | undefined,
): MarketDataStatus {
  if (!assets || assets.length === 0) {
    return {isStale: false, staleCount: 0, totalCount: 0, staleSymbols: []};
  }
  const staleSymbols: string[] = [];
  for (const asset of assets) {
    // Posições com quantidade zerada não deveriam disparar o aviso — o usuário
    // saiu do papel e ele só está no histórico.
    const qty = Number(asset?.quantity ?? 0);
    if (!(qty > 0)) continue;
    if (!hasFreshQuote(asset)) {
      staleSymbols.push(String(asset?.symbol ?? '').trim() || '—');
    }
  }
  return {
    isStale: staleSymbols.length > 0,
    staleCount: staleSymbols.length,
    totalCount: assets.length,
    staleSymbols,
  };
}

// Retorno de um único ativo desde o preço médio de compra — não é variação
// diária. `currentValue` é o valor atual da posição (preço * quantidade).
export function computeReturnSinceAvgPrice(
  asset:
    | {
        avgPrice?: number;
        averagePrice?: number;
        average_price?: number;
        quantity?: number;
      }
    | null
    | undefined,
  currentValue: number,
): number {
  const cost = getAveragePrice(asset) * Number(asset?.quantity || 0);
  if (!(cost > 0)) return 0;
  const pnl = currentValue - cost;
  return (pnl / cost) * 100;
}
