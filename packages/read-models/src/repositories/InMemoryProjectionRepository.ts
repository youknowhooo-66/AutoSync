import { IProjectionRepository } from './IProjectionRepository';

export class InMemoryProjectionRepository<TView> implements IProjectionRepository<TView> {
  private store = new Map<string, TView>();

  async get(id: string): Promise<TView | null> {
    return this.store.get(id) ?? null;
  }

  async upsert(id: string, view: TView): Promise<void> {
    this.store.set(id, view);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async findAll(): Promise<TView[]> {
    return Array.from(this.store.values());
  }

  async findBy(predicate: (view: TView) => boolean): Promise<TView[]> {
    return Array.from(this.store.values()).filter(predicate);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
