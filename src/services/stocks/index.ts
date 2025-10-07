import {stockServices} from '@/server/api/api';
import {IStock} from '@/interface/stock';
import {
  StockAllNacionalResponse,
  StockGlobalResponse,
  StockNacionalResponse,
} from '@/types/stock';

export class Stock implements IStock {
  async getAllNacionalStocks(): Promise<StockAllNacionalResponse> {
    const response = await stockServices.getAllNationalStocks();
    return response.data;
  }

  async getNationalStock(symbol: string): Promise<StockNacionalResponse> {
    const response = await stockServices.getNationalStock(symbol);
    return response.data;
  }

  async getGlobalStock(symbol: string): Promise<StockGlobalResponse> {
    const response = await stockServices.getGlobalStock(symbol);
    return response.data;
  }
}

export default new Stock();
