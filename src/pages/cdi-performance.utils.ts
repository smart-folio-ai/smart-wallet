// O CDI vem do BACEN como taxa DIÁRIA em percentual, não como nível de
// índice. Rendimento acumulado é o produto composto — somar as taxas
// subestima o benchmark e faz a carteira parecer melhor do que é.
export function accumulateCdi(
  series: Array<{date: string; value: number}>,
): Map<string, number> {
  const accumulated = new Map<string, number>();

  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));

  // O primeiro ponto é a origem da comparação e vale 0%, como acontece com
  // IBOV e BTC. A taxa do próprio dia inicial não conta: ela já estava
  // rendendo antes da janela começar.
  let factor = 1;
  sorted.forEach((point, index) => {
    if (index > 0) {
      const rate = Number(point.value);
      if (Number.isFinite(rate)) {
        factor *= 1 + rate / 100;
      }
    }
    accumulated.set(point.date, (factor - 1) * 100);
  });

  return accumulated;
}
