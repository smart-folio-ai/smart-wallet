export interface StockNacionalResponse {
  results: Result[];
  requestedAt: string;
  took: string;
}
interface Result {
  currency: string;
  marketCap: number;
  shortName: string;
  longName: string;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayRange: string;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  fiftyTwoWeekRange: string;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  symbol: string;
  logourl: string;
  priceEarnings: number;
  earningsPerShare: number;
}

export interface StockGlobalResponse {
  results: GlobalResult[];
  requestedAt: string;
  took: string;
}

export interface GlobalResult {
  symbol: string;
  name: string;
  exchange: string;
  mic_code: string;
  currency: string;
  datetime: string;
  timestamp: number;
  last_quote_at: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  previous_close: string;
  change: string;
  percent_change: string;
  average_volume: string;
  is_market_open: boolean;
  fifty_two_week: Fiftytwoweek;
}

interface Fiftytwoweek {
  low: string;
  high: string;
  low_change: string;
  high_change: string;
  low_change_percent: string;
  high_change_percent: string;
  range: string;
}

export interface StockAllNacionalResponse {
  indexes: Index[];
  stocks: Stock[];
  availableSectors: string[];
  availableStockTypes: string[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalCount: number;
  hasNextPage: boolean;
}

interface Stock {
  stock: string;
  name: string;
  close: number;
  change: number;
  volume: number;
  market_cap: null | number;
  logo: string;
  sector: string;
  type: string;
}

interface Index {
  stock: string;
  name: string;
}
