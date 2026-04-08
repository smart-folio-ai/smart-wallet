type StockLite = {
  stock: string;
  name: string;
  close: number;
  change: number;
  logo?: string;
  type?: string;
};

export function normalizeStockSymbol(symbol: string): string {
  return String(symbol || '')
    .trim()
    .toUpperCase()
    .replace(/\.SA$/i, '');
}

export function filterAndSortStockSuggestions(
  stocks: StockLite[],
  query: string,
  limit = 7,
): StockLite[] {
  const q = normalizeStockSymbol(query).toLowerCase();
  if (!q) return [];

  return stocks
    .filter(
      (s) =>
        normalizeStockSymbol(s.stock).toLowerCase().includes(q) ||
        (s.name && s.name.toLowerCase().includes(q)),
    )
    .sort((a, b) => {
      const aSymbol = normalizeStockSymbol(a.stock).toLowerCase();
      const bSymbol = normalizeStockSymbol(b.stock).toLowerCase();
      if (aSymbol === q) return -1;
      if (bSymbol === q) return 1;

      const aPrefix = aSymbol.startsWith(q);
      const bPrefix = bSymbol.startsWith(q);
      if (aPrefix && !bPrefix) return -1;
      if (bPrefix && !aPrefix) return 1;

      const aContains = aSymbol.includes(q);
      const bContains = bSymbol.includes(q);
      if (aContains && !bContains) return -1;
      if (bContains && !aContains) return 1;

      return aSymbol.localeCompare(bSymbol);
    })
    .slice(0, limit);
}
