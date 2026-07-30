import { IMaintenanceRepository } from '../maintenance/IMaintenanceRepository';
import { IEventBus } from '../shared/IEventBus';

export interface ApproveWorkItemInputDTO {
  maintenanceId: string;
  workItemId: string;
  approvedBy: string;
  correlationId: string;
}

export class ApproveWorkItemUseCase {
  constructor(
    private readonly maintenanceRepo: IMaintenanceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ApproveWorkItemInputDTO): Promise<void> {
    // 1. Carregar Maintenance
    const maintenance = await this.maintenanceRepo.findById(input.maintenanceId);
    if (!maintenance) {
      throw new Error(`Maintenance "${input.maintenanceId}" not found`);
    }

    // WorkItems need to be in AWAITING_APPROVAL before they can be approved.
    // If the workitem is PENDING, we must submit it first (Application Layer orchestrating domain logic).
    const workItem = maintenance.workItems.find((w) => w.id.value === input.workItemId);
    if (!workItem) {
      throw new Error(`WorkItem "${input.workItemId}" not found in Maintenance`);
    }

    if (workItem.status === 'PENDING') {
      maintenance.submitForApproval(); // Transita os pendentes para aguardando aprovação
    }

    // 2. Executar Regra de Domínio (Aprovação)
    maintenance.approveWorkItem({
      workItemId: input.workItemId,
      approvedBy: input.approvedBy,
      correlationId: input.correlationId,
    });

    // 3. Persistir Aggregate
    await this.maintenanceRepo.save(maintenance);

    // 4. Despachar Eventos de Domínio (WorkItemApproved.v1)
    await this.eventBus.dispatchAll(maintenance.domainEvents);
    maintenance.clearEvents();
  }
}
