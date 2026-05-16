// apps/api/src/modules/stock/services/CreateStockService.ts

import { IStockRepository, Stock } from '../repositories/IStockRepository';
import { CreateStockDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateStockService {
  constructor(private stockRepository: IStockRepository) {}

  async execute(data: CreateStockDTO): Promise<Stock> {
    const { companyId, productId } = data;

    if (!companyId) {
      throw new AppError('Company ID is required.');
    }

    const stockExists = await this.stockRepository.findByProduct(productId, companyId);

    if (stockExists) {
      throw new AppError('Stock for this product already exists. Use update instead.', 409);
    }

    const stock = await this.stockRepository.create(data);

    return stock;
  }
}
