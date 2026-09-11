
// Helper function to format currency
export const formatCurrency = (value: number, currency: string = 'BRL') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase() || 'BRL',
  }).format(value);
};

// Helper function to format percentage
export const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

/*
 * Formatadores no padrão do handoff (design_handoff_trackerr/README.md,
 * "Números"): separador decimal pt-BR, sinal explícito na variação
 * (`+28,7%` / `-6,9%`) e `p.p.` para diferença entre percentuais.
 *
 * `formatPercentage` acima usa ponto decimal e segue em uso por telas mais
 * antigas; trocá-lo mexe em 7 arquivos e 3 specs, então fica para uma troca
 * dedicada. Código novo usa estes.
 */

const ptBrNumber = (value: number, digits: number) =>
  Math.abs(value).toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const signOf = (value: number) => (value > 0 ? '+' : value < 0 ? '-' : '');

/** `7,42%` — percentual sem sinal, para níveis (yield, peso). */
export const formatPctPtBr = (value: number, digits = 2): string =>
  `${value < 0 ? '-' : ''}${ptBrNumber(value, digits)}%`;

/** `+17,1%` — variação com sinal explícito. */
export const formatSignedPctPtBr = (value: number, digits = 1): string =>
  `${signOf(value)}${ptBrNumber(value, digits)}%`;

/** `+0,6 p.p.` — diferença entre dois percentuais. */
export const formatPpPtBr = (value: number, digits = 1): string =>
  `${signOf(value)}${ptBrNumber(value, digits)} p.p.`;

/** `R$ 48.900` — reais sem centavos, para ordem de grandeza. */
export const formatCurrencyWholePtBr = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);

/** `R$ 74,2k` — valor compacto para subtexto de KPI. */
export const formatCurrencyCompactPtBr = (value: number): string => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}R$ ${ptBrNumber(abs / 1_000_000, 1)}mi`;
  if (abs >= 1_000) return `${sign}R$ ${ptBrNumber(abs / 1_000, 1)}k`;
  return `${sign}R$ ${ptBrNumber(abs, 0)}`;
};
