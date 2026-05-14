// apps/api/src/modules/stock/services/ListStockService.ts

import { IStockRepository, Stock } from '../repositories/IStockRepository';
import { AppError } from '../../../shared/errors/AppError';

export class ListStockService {
  constructor(private stockRepository: IStockRepository) {}

  async execute(companyId: string): Promise<Stock[]> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const stocks = await this.stockRepository.findManyByCompany(companyId);

    return stocks;
  }
}
