import { Maintenance } from '@autosync/domain';
import { IRepository } from '../shared/IRepository';

export interface IMaintenanceRepository extends IRepository<Maintenance> {
  findById(id: string): Promise<Maintenance | null>;
  save(maintenance: Maintenance): Promise<void>;
}
