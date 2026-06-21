export type VehicleTimelineEntryType = 'MAINTENANCE' | 'WORK_ITEM_COMPLETED' | 'INVOICE';

export interface VehicleTimelineEntry {
  date: Date;
  type: VehicleTimelineEntryType;
  description: string;
  value?: number;
  referenceId: string;
}

export interface VehicleHistoryView {
  vehicleId: string;
  companyId: string;
  totalMaintenances: number;
  totalSpent: number;
  lastMaintenanceDate: Date | null;
  timeline: VehicleTimelineEntry[];
  updatedAt: Date;
}
