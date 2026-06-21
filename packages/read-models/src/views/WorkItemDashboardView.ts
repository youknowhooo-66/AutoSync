export type WorkItemStatus = 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';

export interface WorkItemDashboardView {
  workItemId: string;
  maintenanceId: string;
  companyId: string;
  vehicleId: string;
  vehiclePlate: string;
  clientId: string;
  clientName: string;
  description: string;
  status: WorkItemStatus;
  assignedTechnicianId: string | null;
  assignedTechnicianName: string | null;
  estimatedCost: number;
  actualCost: number;
  evidenceCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
