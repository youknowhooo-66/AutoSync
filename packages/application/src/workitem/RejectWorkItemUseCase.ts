import { IMaintenanceRepository } from '../maintenance/IMaintenanceRepository';
import { IEventBus } from '../shared/IEventBus';

export interface RejectWorkItemInputDTO {
  maintenanceId: string;
  workItemId: string;
  reason: string;
  correlationId: string;
}

export class RejectWorkItemUseCase {
  constructor(
    private readonly maintenanceRepo: IMaintenanceRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: RejectWorkItemInputDTO): Promise<void> {
    // 1. Carregar Maintenance
    const maintenance = await this.maintenanceRepo.findById(input.maintenanceId);
    if (!maintenance) {
      throw new Error(`Maintenance "${input.maintenanceId}" not found`);
    }

    // Se estiver pendente, transitar para awaiting_approval antes de rejeitar
    const workItem = maintenance.workItems.find((w) => w.id.value === input.workItemId);
    if (!workItem) {
      throw new Error(`WorkItem "${input.workItemId}" not found in Maintenance`);
    }

    if (workItem.status === 'PENDING') {
      maintenance.submitForApproval();
    }

    // 2. Executar Regra de Domínio (Rejeição)
    maintenance.rejectWorkItem({
      workItemId: input.workItemId,
      reason: input.reason,
      correlationId: input.correlationId,
    });

    // 3. Persistir Aggregate
    await this.maintenanceRepo.save(maintenance);

    // 4. Despachar Eventos de Domínio (WorkItemRejected.v1)
    await this.eventBus.dispatchAll(maintenance.domainEvents);
    maintenance.clearEvents();
  }
}
