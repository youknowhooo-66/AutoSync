// apps/api/src/modules/stock/repositories/IStockRepository.ts

import { CreateStockDTO, UpdateStockDTO } from '../dtos';

export interface Stock {
  id: string;
  companyId: string;
  productId: string;
  quantity: number;
  location?: string;
  minimumStock?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStockRepository {
  create(data: CreateStockDTO): Promise<Stock>;
  findById(id: string, companyId: string): Promise<Stock | null>;
  findByProductId(productId: string, companyId: string): Promise<Stock | null>;
  findManyByCompany(companyId: string): Promise<Stock[]>;
  update(data: UpdateStockDTO): Promise<Stock>;
  delete(id: string, companyId: string): Promise<void>;
}
