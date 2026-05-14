// apps/api/src/modules/stock/services/CreateStockService.ts

import { IStockRepository, Stock } from '../repositories/IStockRepository';
import { CreateStockDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class CreateStockService {
  constructor(private stockRepository: IStockRepository) {}

  async execute({ companyId, productId, quantity, location, minimumStock }: CreateStockDTO): Promise<Stock> {
    if (!companyId) {
      throw new AppError('Company ID is required.');
    }
    if (!productId) {
      throw new AppError('Product ID is required.');
    }
    if (quantity === undefined || quantity < 0) {
      throw new AppError('Quantity must be a non-negative number.');
    }

    const stockExists = await this.stockRepository.findByProductId(productId, companyId);

    if (stockExists) {
      throw new AppError('Stock entry for this product already exists for this company. Please update existing entry.', 409);
    }

    const stock = await this.stockRepository.create({
      companyId,
      productId,
      quantity,
      location,
      minimumStock,
    });

    return stock;
  }
}
