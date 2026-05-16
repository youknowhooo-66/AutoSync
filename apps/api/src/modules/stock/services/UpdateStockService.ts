// apps/api/src/modules/stock/services/UpdateStockService.ts

import { IStockRepository, Stock } from '../repositories/IStockRepository';
import { UpdateStockDTO } from '../dtos';
import { AppError } from '../../../shared/errors/AppError';

export class UpdateStockService {
  constructor(private stockRepository: IStockRepository) {}

  async execute(data: UpdateStockDTO): Promise<Stock> {
    const { id, companyId } = data;

    const stockExists = await this.stockRepository.findById(id, companyId);

    if (!stockExists) {
      throw new AppError('Stock item not found.', 404);
    }

    const stock = await this.stockRepository.update(data);

    return stock;
  }
}
