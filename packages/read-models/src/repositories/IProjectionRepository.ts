export type ProjectionName =
  | 'workItemDashboard'
  | 'maintenanceOverview'
  | 'inventory'
  | 'technicianProductivity'
  | 'financialDashboard'
  | 'vehicleHistory'
  | 'auditTrail';

export interface IProjectionRepository<TView> {
  get(id: string): Promise<TView | null>;
  upsert(id: string, view: TView): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<TView[]>;
  findBy(predicate: (view: TView) => boolean): Promise<TView[]>;
  clear(): Promise<void>;
}

export interface IProjectionStore {
  workItemDashboard: IProjectionRepository<import('../views/WorkItemDashboardView').WorkItemDashboardView>;
  maintenanceOverview: IProjectionRepository<import('../views/MaintenanceOverviewView').MaintenanceOverviewView>;
  inventory: IProjectionRepository<import('../views/InventoryProjectionView').InventoryProjectionView>;
  technicianProductivity: IProjectionRepository<import('../views/TechnicianProductivityView').TechnicianProductivityView>;
  financialDashboard: IProjectionRepository<import('../views/FinancialDashboardView').FinancialDashboardView>;
  vehicleHistory: IProjectionRepository<import('../views/VehicleHistoryView').VehicleHistoryView>;
  auditTrail: IProjectionRepository<import('../views/AuditTrailView').AuditTrailView>;

  clearProjection(name: ProjectionName): Promise<void>;
  clearAll(): Promise<void>;
}
