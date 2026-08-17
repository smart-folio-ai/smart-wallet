export const parseHistoryDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const HISTORY_WINDOW_DAYS: Record<string, number> = {
  '7D': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1A': 365,
  '5A': 1825,
};

// Espelha o fallback de `historyByPeriod`: se o recorte do período nominal
// deixa 1 ponto ou menos, usa o histórico inteiro em vez de um recorte vazio.
export const filterHistoryByPeriod = <T extends {date: unknown}>(
  history: T[],
  selectedPeriod: string,
): T[] => {
  const limitDays = HISTORY_WINDOW_DAYS[selectedPeriod] || 30;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - limitDays);
  const filtered = history.filter((item) => {
    const parsed = parseHistoryDate(item.date);
    return parsed ? parsed >= threshold : false;
  });
  return filtered.length > 1 ? filtered : history;
};

// Bucket de `range` do brapi que cobre `days` dias — usado para alargar a
// busca de IBOV/BTC quando o fallback de histórico amplia a janela real
// além do período nominal selecionado.
export const brapiRangeForDays = (days: number): string => {
  if (days <= 5) return '5d';
  if (days <= 30) return '1mo';
  if (days <= 90) return '3mo';
  if (days <= 180) return '6mo';
  if (days <= 365) return '1y';
  return '5y';
};

const toLocalIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export interface EffectiveHistoryWindow {
  fromIso: string;
  toIso: string;
  days: number;
}

// Primeira data efetivamente presente no histórico já filtrado (pós-
// fallback) até hoje, em horário local — não a janela nominal do período
// nem `toISOString()` (UTC, que desloca a borda em até um dia em UTC-3).
export const getEffectiveHistoryWindow = (
  history: {date: unknown}[],
): EffectiveHistoryWindow | null => {
  const parsedDates = history
    .map((item) => parseHistoryDate(item.date))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  if (parsedDates.length === 0) return null;

  const from = parsedDates[0];
  const today = new Date();
  const days = Math.max(
    1,
    Math.ceil((today.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)),
  );
  return {fromIso: toLocalIsoDate(from), toIso: toLocalIsoDate(today), days};
};
