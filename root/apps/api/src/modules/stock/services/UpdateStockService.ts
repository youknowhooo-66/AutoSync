// apps/api/src/modules/stock/services/UpdateStockService.ts

import { IStockRepository, Stock } from '../repositories/IStockRepository';
import { UpdateStockDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateStockService {
  constructor(private stockRepository: IStockRepository) {}

  async execute({ id, companyId, productId, quantity, location, minimumStock }: UpdateStockDTO): Promise<Stock> {
    if (!id || !companyId) {
      throw new AppError('Stock ID and Company ID are required.');
    }

    const stock = await this.stockRepository.findById(id, companyId);

    if (!stock) {
      throw new AppError('Stock entry not found.', 404);
    }

    if (quantity !== undefined && quantity < 0) {
      throw new AppError('Quantity must be a non-negative number.');
    }

    const updatedStock = await this.stockRepository.update({
      id,
      companyId,
      productId: productId || stock.productId,
      quantity: quantity !== undefined ? quantity : stock.quantity,
      location: location || stock.location,
      minimumStock: minimumStock !== undefined ? minimumStock : stock.minimumStock,
    });

    return updatedStock;
  }
}
