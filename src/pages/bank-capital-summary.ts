export interface BankCapitalSummaryInput {
  basileia: number | null;
  imobilizacao: number | null;
}

const IMOBILIZACAO_LIMIT = 50;

function formatOnePlace(value: number): string {
  return value.toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
}

export function buildBankCapitalSummary(input: BankCapitalSummaryInput): string | null {
  const parts: string[] = [];

  // `!=` proposital: ver capital-ratio-gauge.tsx. `undefined` vindo de um payload
  // parcial precisa ser tratado como ausencia, nao formatado como numero.
  if (input.basileia != null) {
    parts.push(`Índice de Basileia de ${formatOnePlace(input.basileia)}%.`);
  }

  if (input.imobilizacao != null) {
    const qualifier =
      input.imobilizacao <= IMOBILIZACAO_LIMIT
        ? `dentro do limite regulatório de ${IMOBILIZACAO_LIMIT}%`
        : `acima do limite regulatório de ${IMOBILIZACAO_LIMIT}%`;
    parts.push(`Índice de Imobilização de ${formatOnePlace(input.imobilizacao)}%, ${qualifier}.`);
  }

  return parts.length > 0 ? parts.join(' ') : null;
}
