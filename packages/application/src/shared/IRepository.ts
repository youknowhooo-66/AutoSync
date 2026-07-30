import { AggregateRoot, Entity } from '@autosync/domain';

/**
 * Base Repository Interface
 * All domain repositories should extend this or use it as a pattern.
 */
export interface IRepository<T extends AggregateRoot<any> | Entity<any>> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
}
