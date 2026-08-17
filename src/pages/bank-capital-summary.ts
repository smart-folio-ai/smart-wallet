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

/**
 * Formata o periodo de referencia ('YYYY-MM') como trimestre legivel: '2026-03'
 * vira '1º tri/2026'. O servidor pode recuar ate 4 trimestres quando o BCB ainda
 * nao publicou o mais recente, entao o periodo precisa aparecer no card.
 * Devolve null para periodo ausente ou fora do formato esperado.
 */
export function formatBankCapitalPeriod(period: string | null | undefined): string | null {
  if (typeof period !== 'string') return null;

  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return null;

  const year = match[1];
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  const quarter = Math.ceil(month / 3);
  return `${quarter}º tri/${year}`;
}
