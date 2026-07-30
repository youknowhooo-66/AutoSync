import {
  WorkItemDashboardProjector,
  MaintenanceOverviewProjector,
  InventoryProjector,
  TechnicianProductivityProjector,
  FinancialDashboardProjector,
  VehicleHistoryProjector,
  AuditTrailProjector,
} from '../projections';
import { IProjectionStore } from '../repositories';
import { IReferenceDataLookup } from '../projections/shared/ReferenceDataLookup';
import { IProjectionIdempotencyTracker } from '../projections/shared/ProjectionIdempotency';

export class ProjectionRegistry {
  readonly workItemDashboard: WorkItemDashboardProjector;
  readonly maintenanceOverview: MaintenanceOverviewProjector;
  readonly inventory: InventoryProjector;
  readonly technicianProductivity: TechnicianProductivityProjector;
  readonly financialDashboard: FinancialDashboardProjector;
  readonly vehicleHistory: VehicleHistoryProjector;
  readonly auditTrail: AuditTrailProjector;

  constructor(
    store: IProjectionStore,
    referenceData: IReferenceDataLookup,
    idempotency: IProjectionIdempotencyTracker,
  ) {
    this.workItemDashboard = new WorkItemDashboardProjector(store, referenceData, idempotency);
    this.maintenanceOverview = new MaintenanceOverviewProjector(store, referenceData, idempotency);
    this.inventory = new InventoryProjector(store, idempotency);
    this.technicianProductivity = new TechnicianProductivityProjector(store, referenceData, idempotency);
    this.financialDashboard = new FinancialDashboardProjector(store, idempotency);
    this.vehicleHistory = new VehicleHistoryProjector(store, referenceData, idempotency);
    this.auditTrail = new AuditTrailProjector(store);
  }
}
