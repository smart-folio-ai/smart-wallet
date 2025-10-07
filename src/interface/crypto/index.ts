export interface Cryptos {
  coins: Coin[];
}

interface Coin {
  currency: string;
  currencyRateFromUSD: number;
  coinName: string;
  coin: string;
  regularMarketChange: number;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketDayLow: number;
  regularMarketDayHigh: number;
  regularMarketDayRange: string;
  regularMarketVolume: number;
  marketCap: number;
  regularMarketTime: string;
  coinImageUrl: string;
  usedInterval: string;
  usedRange: string;
  historicalDataPrice: HistoricalDataPrice[];
  validRanges: string[];
  validIntervals: string[];
}

interface HistoricalDataPrice {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose: number;
}
