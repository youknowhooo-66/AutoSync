import { Measurement, AccountPayable, AccountReceivable } from '@autosync/domain';
import { IRepository } from '../shared/IRepository';

export interface IFinanceRepository extends IRepository<Measurement> {
  findById(id: string): Promise<Measurement | null>;
  save(measurement: Measurement): Promise<void>;
  
  savePayable(payable: AccountPayable): Promise<void>;
  saveReceivable(receivable: AccountReceivable): Promise<void>;
}
