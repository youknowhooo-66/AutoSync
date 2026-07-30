// apps/api/src/modules/stock/services/DeleteStockService.ts

import { IStockRepository } from '../repositories/IStockRepository';
import { AppError } from '../../../shared/errors/AppError';

export class DeleteStockService {
  constructor(private stockRepository: IStockRepository) {}

  async execute(id: string, companyId: string): Promise<void> {
    const stockExists = await this.stockRepository.findById(id, companyId);

    if (!stockExists) {
      throw new AppError('Stock item not found.', 404);
    }

    await this.stockRepository.delete(id, companyId);
  }
}
