import { WorkItemApprovedV1 } from '@autosync/domain';
import { 
  ReserveStockForWorkItemUseCase, 
  AssignTechnicianUseCase 
} from '@autosync/application';

export class WorkItemApprovedHandler {
  constructor(
    private readonly reserveStockUseCase: ReserveStockForWorkItemUseCase,
    private readonly assignTechnicianUseCase: AssignTechnicianUseCase,
  ) {}

  async handle(event: WorkItemApprovedV1): Promise<void> {
    const { workItemId } = event.payload;

    // 1. Reserve Stock (assuming standard stock logic for this POC)
    // In a real scenario, the WorkItem would have a Bill of Materials.
    // We reserve a mock stock item here for orchestration testing.
    await this.reserveStockUseCase.execute({
      stockItemId: 'stock-item-id-1', // Mock or fetched
      workItemId,
      quantity: 1,
      correlationId: event.correlationId,
    });

    // 2. Assign Technician
    await this.assignTechnicianUseCase.execute({
      workItemId,
      technicianId: 'tech-user-1', // Automatically assign to a pool or specific user
      specialty: 'GENERAL',
      correlationId: event.correlationId,
    });
    
    console.log(`[WorkItemApprovedHandler] Successfully processed WorkItem ${workItemId}`);
  }
}
