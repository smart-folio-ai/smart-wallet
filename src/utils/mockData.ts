
import { Asset, AssetPerformance } from "@/types/portfolio";

// Mock data
export const mockAssets: Asset[] = [
  {
    id: "1",
    symbol: "PETR4",
    name: "Petrobras",
    price: 30.45,
    change24h: 2.3,
    amount: 100,
    value: 3045.00,
    allocation: 12,
    type: "stock",
    dividendYield: 12.5,
    lastDividend: 1.25,
    sector: "Petróleo e Gás",
    purchasePrice: 28.75,
    avgPrice: 28.75,
    purchaseDate: "2023-05-15",
    profitLoss: 170.00,
    profitLossPercentage: 5.91,
    aiRecommendation: "hold",
    aiConfidence: 75,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 28 + Math.random() * 5,
      };
    }),
    dividendHistory: [
      { date: "2023-11-15", value: 0.75 },
      { date: "2023-08-15", value: 0.65 },
      { date: "2023-05-15", value: 0.70 },
      { date: "2023-02-15", value: 0.60 },
    ]
  },
  {
    id: "2",
    symbol: "VALE3",
    name: "Vale",
    price: 65.70,
    change24h: -1.2,
    amount: 50,
    value: 3285.00,
    allocation: 13,
    type: "stock",
    dividendYield: 8.7,
    lastDividend: 0.85,
    sector: "Mineração",
    purchasePrice: 62.30,
    avgPrice: 62.30,
    purchaseDate: "2023-03-10",
    profitLoss: 170.00,
    profitLossPercentage: 5.45,
    aiRecommendation: "buy",
    aiConfidence: 82,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 60 + Math.random() * 8,
      };
    }),
    dividendHistory: [
      { date: "2023-11-05", value: 0.95 },
      { date: "2023-08-05", value: 0.90 },
      { date: "2023-05-05", value: 0.85 },
      { date: "2023-02-05", value: 0.80 },
    ]
  },
  {
    id: "3",
    symbol: "BTC",
    name: "Bitcoin",
    price: 225000.00,
    change24h: 4.5,
    amount: 0.025,
    value: 5625.00,
    allocation: 22,
    type: "crypto",
    purchasePrice: 200000.00,
    avgPrice: 195000.00,
    purchaseDate: "2023-01-15",
    profitLoss: 625.00,
    profitLossPercentage: 12.5,
    aiRecommendation: "buy",
    aiConfidence: 88,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 190000 + Math.random() * 40000,
      };
    }),
  },
  {
    id: "4",
    symbol: "HGLG11",
    name: "CSHG Logística",
    price: 160.50,
    change24h: 0.8,
    amount: 30,
    value: 4815.00,
    allocation: 19,
    type: "fii",
    dividendYield: 9.2,
    lastDividend: 1.38,
    sector: "Logística",
    purchasePrice: 155.20,
    avgPrice: 152.45,
    purchaseDate: "2023-02-20",
    profitLoss: 159.00,
    profitLossPercentage: 3.41,
    aiRecommendation: "buy",
    aiConfidence: 79,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 155 + Math.random() * 10,
      };
    }),
    dividendHistory: [
      { date: "2023-11-20", value: 1.38 },
      { date: "2023-10-20", value: 1.35 },
      { date: "2023-09-20", value: 1.36 },
      { date: "2023-08-20", value: 1.32 },
      { date: "2023-07-20", value: 1.30 },
      { date: "2023-06-20", value: 1.35 },
    ]
  },
  {
    id: "5",
    symbol: "ETH",
    name: "Ethereum",
    price: 12500.00,
    change24h: -2.1,
    amount: 0.2,
    value: 2500.00,
    allocation: 10,
    type: "crypto",
    purchasePrice: 13000.00,
    avgPrice: 13250.00,
    purchaseDate: "2023-04-10",
    profitLoss: -100.00,
    profitLossPercentage: -4.0,
    aiRecommendation: "hold",
    aiConfidence: 65,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 11000 + Math.random() * 3000,
      };
    }),
  },
  {
    id: "6",
    symbol: "KNRI11",
    name: "Kinea Rendimentos",
    price: 95.20,
    change24h: 1.2,
    amount: 25,
    value: 2380.00,
    allocation: 9,
    type: "fii",
    dividendYield: 8.5,
    lastDividend: 0.95,
    sector: "Títulos e Valores Mobiliários",
    purchasePrice: 90.50,
    avgPrice: 91.75,
    purchaseDate: "2023-06-05",
    profitLoss: 117.50,
    profitLossPercentage: 5.19,
    aiRecommendation: "hold",
    aiConfidence: 70,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 90 + Math.random() * 8,
      };
    }),
    dividendHistory: [
      { date: "2023-11-10", value: 0.95 },
      { date: "2023-10-10", value: 0.93 },
      { date: "2023-09-10", value: 0.94 },
      { date: "2023-08-10", value: 0.91 },
      { date: "2023-07-10", value: 0.90 },
      { date: "2023-06-10", value: 0.92 },
    ]
  },
  {
    id: "7",
    symbol: "ITSA4",
    name: "Itaúsa",
    price: 12.35,
    change24h: 0.5,
    amount: 200,
    value: 2470.00,
    allocation: 10,
    type: "stock",
    dividendYield: 6.8,
    lastDividend: 0.15,
    sector: "Financeiro",
    purchasePrice: 11.90,
    avgPrice: 11.95,
    purchaseDate: "2023-07-20",
    profitLoss: 90.00,
    profitLossPercentage: 3.78,
    aiRecommendation: "sell",
    aiConfidence: 68,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 11.5 + Math.random() * 1.5,
      };
    }),
    dividendHistory: [
      { date: "2023-11-25", value: 0.15 },
      { date: "2023-08-25", value: 0.14 },
      { date: "2023-05-25", value: 0.13 },
      { date: "2023-02-25", value: 0.12 },
    ]
  },
  {
    id: "8",
    symbol: "XRP",
    name: "Ripple",
    price: 3.25,
    change24h: 3.8,
    amount: 400,
    value: 1300.00,
    allocation: 5,
    type: "crypto",
    purchasePrice: 2.90,
    avgPrice: 2.85,
    purchaseDate: "2023-08-15",
    profitLoss: 140.00,
    profitLossPercentage: 12.07,
    aiRecommendation: "hold",
    aiConfidence: 60,
    history: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().slice(0, 10),
        price: 2.8 + Math.random() * 0.8,
      };
    }),
  },
];

export const performanceData: Record<string, AssetPerformance[]> = {
  stocks: [
    { period: '1D', value: 8800.00, change: 1.7 },
    { period: '1S', value: 8750.00, change: 1.2 },
    { period: '1M', value: 8500.00, change: -1.5 },
    { period: '3M', value: 8200.00, change: -4.9 },
    { period: '6M', value: 7800.00, change: -9.4 },
    { period: 'YTD', value: 7500.00, change: -13.0 },
    { period: '1A', value: 7200.00, change: -16.8 },
    { period: 'Desde o Início', value: 6500.00, change: 35.4 },
  ],
  fiis: [
    { period: '1D', value: 7195.00, change: 0.9 },
    { period: '1S', value: 7150.00, change: 0.3 },
    { period: '1M', value: 7050.00, change: -1.2 },
    { period: '3M', value: 6950.00, change: -2.6 },
    { period: '6M', value: 6800.00, change: -4.7 },
    { period: 'YTD', value: 6700.00, change: -6.1 },
    { period: '1A', value: 6500.00, change: -9.1 },
    { period: 'Desde o Início', value: 5800.00, change: 24.1 },
  ],
  crypto: [
    { period: '1D', value: 9425.00, change: 2.5 },
    { period: '1S', value: 9000.00, change: -2.4 },
    { period: '1M', value: 8500.00, change: -7.6 },
    { period: '3M', value: 7800.00, change: -15.2 },
    { period: '6M', value: 6900.00, change: -25.0 },
    { period: 'YTD', value: 6200.00, change: -32.7 },
    { period: '1A', value: 5800.00, change: -37.0 },
    { period: 'Desde o Início', value: 4000.00, change: 135.6 },
  ],
};
