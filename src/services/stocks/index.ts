import {stockServices} from '@/server/api/api';
import {IStock} from '@/interface/stock';
import {
  StockAllNacionalResponse,
  StockGlobalResponse,
  StockNacionalResponse,
} from '@/types/stock';

export class Stock implements IStock {
  async getAllNacionalStocks(): Promise<StockAllNacionalResponse[]> {
    const response = await stockServices.getAllNationalStocks();
    return response.data;
  }
  async getNationalStock(stock: string): Promise<StockNacionalResponse[]> {
    const response = await stockServices.getNationalStock(stock);
    return response.data;
  }

  async getGlobalStock(stock: string): Promise<StockGlobalResponse[]> {
    const response = await stockServices.getGlobalStock(stock);
    return response.data;
  }
}

export default new Stock();
