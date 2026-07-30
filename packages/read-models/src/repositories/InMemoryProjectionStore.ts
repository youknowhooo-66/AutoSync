import { ProjectionName, IProjectionStore } from './IProjectionRepository';
import { InMemoryProjectionRepository } from './InMemoryProjectionRepository';
import {
  WorkItemDashboardView,
  MaintenanceOverviewView,
  InventoryProjectionView,
  TechnicianProductivityView,
  FinancialDashboardView,
  VehicleHistoryView,
  AuditTrailView,
} from '../views';

export class InMemoryProjectionStore implements IProjectionStore {
  workItemDashboard = new InMemoryProjectionRepository<WorkItemDashboardView>();
  maintenanceOverview = new InMemoryProjectionRepository<MaintenanceOverviewView>();
  inventory = new InMemoryProjectionRepository<InventoryProjectionView>();
  technicianProductivity = new InMemoryProjectionRepository<TechnicianProductivityView>();
  financialDashboard = new InMemoryProjectionRepository<FinancialDashboardView>();
  vehicleHistory = new InMemoryProjectionRepository<VehicleHistoryView>();
  auditTrail = new InMemoryProjectionRepository<AuditTrailView>();

  async clearProjection(name: ProjectionName): Promise<void> {
    switch (name) {
      case 'workItemDashboard':
        await this.workItemDashboard.clear();
        break;
      case 'maintenanceOverview':
        await this.maintenanceOverview.clear();
        break;
      case 'inventory':
        await this.inventory.clear();
        break;
      case 'technicianProductivity':
        await this.technicianProductivity.clear();
        break;
      case 'financialDashboard':
        await this.financialDashboard.clear();
        break;
      case 'vehicleHistory':
        await this.vehicleHistory.clear();
        break;
      case 'auditTrail':
        await this.auditTrail.clear();
        break;
    }
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      this.workItemDashboard.clear(),
      this.maintenanceOverview.clear(),
      this.inventory.clear(),
      this.technicianProductivity.clear(),
      this.financialDashboard.clear(),
      this.vehicleHistory.clear(),
      this.auditTrail.clear(),
    ]);
  }
}
