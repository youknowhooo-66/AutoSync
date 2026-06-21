export interface TechnicianProductivityView {
  technicianId: string;
  companyId: string;
  totalHoursWorked: number;
  completedWorkItems: number;
  averageExecutionHours: number;
  productivityScore: number;
  lastUpdatedAt: Date;
}
