export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface MaintenanceOverviewView {
  maintenanceId: string;
  companyId: string;
  vehicleId: string;
  vehiclePlate: string;
  clientId: string;
  clientName: string;
  totalWorkItems: number;
  pendingWorkItems: number;
  approvedWorkItems: number;
  completedWorkItems: number;
  estimatedValue: number;
  actualValue: number;
  status: MaintenanceStatus;
  createdAt: Date;
  updatedAt: Date;
}
