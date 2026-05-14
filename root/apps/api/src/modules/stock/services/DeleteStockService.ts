// apps/api/src/modules/stock/services/DeleteStockService.ts

import { IStockRepository } from '../repositories/IStockRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteStockService {
  constructor(private stockRepository: IStockRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    if (!id || !companyId) {
      throw new AppError('Stock ID and Company ID are required.');
    }

    const stock = await this.stockRepository.findById(id, companyId);

    if (!stock) {
      throw new AppError('Stock entry not found.', 404);
    }

    await this.stockRepository.delete(id, companyId);
  }
}
