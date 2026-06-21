import { IEventBus } from '../shared/IEventBus';
import { IMaintenanceRepository } from '../maintenance/IMaintenanceRepository';

export interface CompleteWorkItemInput {
  maintenanceId: string;
  workItemId: string;
  correlationId?: string;
}

export class CompleteWorkItemUseCase {
  constructor(
    private readonly maintenanceRepo: IMaintenanceRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: CompleteWorkItemInput): Promise<void> {
    const maintenance = await this.maintenanceRepo.findById(input.maintenanceId);
    
    if (!maintenance) {
      throw new Error(`Maintenance ${input.maintenanceId} not found`);
    }

    // In a real scenario we'd sum up time entries and parts for actual cost.
    // For now we mock the actual cost to 200.00
    maintenance.startWorkItemExecution(input.workItemId);
    maintenance.completeWorkItem({ 
      workItemId: input.workItemId, 
      actualValue: 200.00, 
      correlationId: input.correlationId || 'default'
    });

    await this.maintenanceRepo.save(maintenance);
    await this.eventBus.dispatchAll(maintenance.domainEvents);
    maintenance.clearEvents();
  }
}
