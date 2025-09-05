import {
  StockAllNacionalResponse,
  StockGlobalResponse,
  StockNacionalResponse,
} from '@/types/stock';

export interface IStock {
  getNationalStock(stock: string): Promise<StockNacionalResponse[]>;
  getGlobalStock(stock: string): Promise<StockGlobalResponse[]>;
  getAllNacionalStocks(): Promise<StockAllNacionalResponse[]>;
}
