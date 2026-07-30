import { DomainEvent } from '@autosync/domain';
import {
  MaintenanceCreatedProjectionHandler,
  WorkItemCreatedProjectionHandler,
  WorkItemApprovedProjectionHandler,
  TechnicianAssignedProjectionHandler,
  TimeEntryRegisteredProjectionHandler,
  EvidenceUploadedProjectionHandler,
  WorkItemCompletedProjectionHandler,
  StockReservedProjectionHandler,
  StockReleasedProjectionHandler,
  StockConsumedProjectionHandler,
  StockItemRegisteredProjectionHandler,
  MeasurementGeneratedProjectionHandler,
  InvoiceIssuedProjectionHandler,
  AccountReceivableCreatedProjectionHandler,
  AccountPayableCreatedProjectionHandler,
} from '../handlers';

export class ProjectionEventRouter {
  constructor(private readonly handlers: ProjectionHandlers) {}

  async route(event: DomainEvent<unknown>): Promise<void> {
    switch (event.eventType) {
      case 'MaintenanceCreated':
        return this.handlers.maintenanceCreated.handle(event as any);
      case 'WorkItemCreated':
        return this.handlers.workItemCreated.handle(event as any);
      case 'WorkItemApproved':
        return this.handlers.workItemApproved.handle(event as any);
      case 'TechnicalAssignmentCreated':
        return this.handlers.technicianAssigned.handle(event as any);
      case 'TimeEntryRegistered':
        return this.handlers.timeEntryRegistered.handle(event as any);
      case 'EvidenceUploaded':
        return this.handlers.evidenceUploaded.handle(event as any);
      case 'WorkItemCompleted':
        return this.handlers.workItemCompleted.handle(event as any);
      case 'StockReserved':
        return this.handlers.stockReserved.handle(event as any);
      case 'StockReleased':
        return this.handlers.stockReleased.handle(event as any);
      case 'StockConsumed':
        return this.handlers.stockConsumed.handle(event as any);
      case 'StockItemRegistered':
        return this.handlers.stockItemRegistered.handle(event as any);
      case 'MeasurementGenerated':
        return this.handlers.measurementGenerated.handle(event as any);
      case 'InvoiceIssued':
        return this.handlers.invoiceIssued.handle(event as any);
      case 'AccountReceivableCreated':
        return this.handlers.accountReceivableCreated.handle(event as any);
      case 'AccountPayableCreated':
        return this.handlers.accountPayableCreated.handle(event as any);
      default:
        return this.handlers.auditTrail.handle(event as any);
    }
  }
}

export interface ProjectionHandlers {
  maintenanceCreated: MaintenanceCreatedProjectionHandler;
  workItemCreated: WorkItemCreatedProjectionHandler;
  workItemApproved: WorkItemApprovedProjectionHandler;
  technicianAssigned: TechnicianAssignedProjectionHandler;
  timeEntryRegistered: TimeEntryRegisteredProjectionHandler;
  evidenceUploaded: EvidenceUploadedProjectionHandler;
  workItemCompleted: WorkItemCompletedProjectionHandler;
  stockReserved: StockReservedProjectionHandler;
  stockReleased: StockReleasedProjectionHandler;
  stockConsumed: StockConsumedProjectionHandler;
  stockItemRegistered: StockItemRegisteredProjectionHandler;
  measurementGenerated: MeasurementGeneratedProjectionHandler;
  invoiceIssued: InvoiceIssuedProjectionHandler;
  accountReceivableCreated: AccountReceivableCreatedProjectionHandler;
  accountPayableCreated: AccountPayableCreatedProjectionHandler;
  auditTrail: { handle: (event: DomainEvent<unknown>) => Promise<void> };
}
