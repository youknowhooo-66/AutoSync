export type ServiceExecutionStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OSServiceExecution {
  id: string;
  serviceOrderId: string;
  name: string;
  price: string;
  executionStatus: ServiceExecutionStatus;
  technicianId?: string;
  assignedAt?: string;
  assignedById?: string;
  startedAt?: string;
  startedById?: string;
  pausedAt?: string;
  pausedById?: string;
  pauseReason?: string;
  resumedAt?: string;
  resumedById?: string;
  completedAt?: string;
  completedById?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;

  technician?: {
    id: string;
    name: string;
    email: string;
  };
  assignedBy?: { id: string; name: string };
  startedBy?: { id: string; name: string };
  pausedBy?: { id: string; name: string };
  resumedBy?: { id: string; name: string };
  completedBy?: { id: string; name: string };
}
