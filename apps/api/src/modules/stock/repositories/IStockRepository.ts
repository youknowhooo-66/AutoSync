// apps/api/src/modules/stock/repositories/IStockRepository.ts

import { CreateStockDTO, UpdateStockDTO } from '../dtos';
import { Stock } from "@prisma/client";

export interface IStockRepository {
  create(data: CreateStockDTO): Promise<Stock>;
  findById(id: string, companyId: string): Promise<Stock | null>;
  findByProduct(partId: string, companyId: string): Promise<Stock | null>;
  findManyByCompany(companyId: string): Promise<Stock[]>;
  update(data: UpdateStockDTO): Promise<Stock>;
  delete(id: string, companyId: string): Promise<void>;
}

export type { Stock };
