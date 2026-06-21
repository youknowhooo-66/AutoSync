import { StockItem } from '@autosync/domain';
import { IRepository } from '../shared/IRepository';

export interface IInventoryRepository extends IRepository<StockItem> {
  findById(id: string): Promise<StockItem | null>;
  save(stockItem: StockItem): Promise<void>;
}
